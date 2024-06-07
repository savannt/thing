import stripe from "@/services/stripe";

import { clerkClient } from "@/services/clerk"

import authenticate from "@/services/authenticateRequest";

export default async function handler(req, res) {
    const { userId } = await authenticate(req, res);
    if(!userId) return;

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

    const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: process.env.NEXTAUTH_URL,
    });

    res.status(200).json({
        url: session.url,
        membership: user.membership,
    });
}