import stripe from "@/services/stripe";

import authenticate from "@/services/authenticateRequest";
import { clerkClient } from "@clerk/nextjs";

if(!process.env.STRIPE_ENTERPRISE_PRICE) throw new Error("STRIPE_ENTERPRISE_PRICE is not defined in .env.local");
const ENTERPRISE_PRICE = process.env.STRIPE_ENTERPRISE_PRICE;

export default async function handler(req, res) {
    let seats = req.query.seats || 1;
    // if typeof string
    if(typeof seats === "string") seats = parseInt(seats);

    const { userId } = await authenticate(req, res);
    if(!userId) return;

    // create stripe checkout page
    let user = await clerkClient.users.getUser(userId);
    if(!user) return res.status(404).json({ message: "User not found" });
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
    if(!stripeCustomerId) return res.status(400).json({ message: "No Stripe Customer ID" });

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer: stripeCustomerId,
        customer_email: user?.email,
        line_items: [{
            price: ENTERPRISE_PRICE,
            quantity: seats,
            adjustable_quantity: {
                enabled: true,
                minimum: 1,
                maximum: 999999,
            },
        }],
        mode: "subscription",
        success_url: `${process.env.NEXTAUTH_URL}/upgrade-success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/upgrade-cancel`,
    });

    res.status(200).json({
        url: session.url,
        membership: user.membership,
    });
}