import stripe from "@/services/stripe";

import { clerkClient } from "@clerk/nextjs";

import authenticate from "@/services/authenticateRequest";

export default async function handler(req, res) {
    const { userId } = await authenticate(req, res);
    if(!userId) return;

    // query param parseInt(seats)
    const changeSeats = req.query.seats ? parseInt(req.query.seats) : false || false;
    let user = await clerkClient.users.getUser(userId);
    if(!user) return res.status(404).json({ message: "User not found" });

    // if public metadata has no stripeCustomerId, create it
    if(!user.publicMetadata.stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            metadata: { userId }
        });
        const stripeCustomerId = customer.id;
        if(!stripeCustomerId) return res.status(500).json({ message: "Failed to create Stripe Customer" });

        const userUpdated = await clerkClient.users.updateUser(userId, {
            publicMetadata: {
                ...user.publicMetadata,
                stripeCustomerId,
            }
        });
        if(!userUpdated) return res.status(500).json({ message: "Failed to update user" });
        user = userUpdated;
    }

    const stripeCustomerId = user.publicMetadata.stripeCustomerId;
    if(!stripeCustomerId) return res.status(400).json({ message: "No Stripe Customer ID?" });

    // if changeSeats provided, call Update Subscriptions API to update quantity by changeSeats
    if(changeSeats) {
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: "active",
        });
        if(subscriptions.data.length === 0) return res.status(400).json({ message: "No active subscriptions" });

        const subscriptionId = subscriptions.data[0].id;
        let newQuantity = subscriptions.data[0].items.data[0].quantity + changeSeats;
        if(newQuantity < 0) newQuantity = 0;
        if(newQuantity === 0) {
            const subscription = await stripe.subscriptions.cancel(subscriptionId);
            if(!subscription) return res.status(500).json({ message: "Failed to delete subscription" });
            user = await clerkClient.users.getUser(userId);
            let publicMetadata = user.publicMetadata;
            publicMetadata.subscribed_seats = 0;
            publicMetadata.user_type = "admin";
            const userUpdated = await clerkClient.users.updateUser(userId, {
                publicMetadata
            });
            if(!userUpdated) return res.status(500).json({ message: "Failed to update user" });
            return res.status(200).json({
                message: "Subscription deleted",
                subscribed_seats: 0,
            });
        }
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            items: [{
                id: subscriptions.data[0].items.data[0].id,
                quantity: newQuantity,
            }],
        });
        if(!subscription) return res.status(500).json({ message: "Failed to update subscription" });

        user = await clerkClient.users.getUser(userId);
        let publicMetadata = user.publicMetadata;
        // publicMetadata.seats = changeSeats;
        publicMetadata.subscribed_seats = newQuantity;
        publicMetadata.user_type = "admin";
        const userUpdated = await clerkClient.users.updateUser(userId, {
            publicMetadata
        });

        if(!userUpdated) return res.status(500).json({ message: "Failed to update user" });

        return res.status(200).json({
            message: "Subscription updated",
            subscribed_seats: newQuantity,
        });
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: process.env.NEXTAUTH_URL,
    });

    res.status(200).json({
        url: session.url,
        membership: user.membership,
    });
}