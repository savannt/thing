import stripe from "@/services/stripe";

import { buffer } from "micro";

// import { users } from "@clerk/nextjs/api";
const users = () => {};

export const config = {
    api: {
        bodyParser: false,
    }
}

if(!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("STRIPE_WEBHOOK_SECRET not set in environment variables");
}

export default async function handler(req, res) {
    const sig = req.headers["stripe-signature"];

    if(!process.env.STRIPE_WEBHOOK_SECRET) {
        console.warn("STRIPE_WEBHOOK_SECRET not set in environment variables");
    }

    if(!sig) {
        console.error("No stripe signature");
        res.status(400).json({ error: "No stripe signature" });
        return;
    }

    // console.log("sig", sig);
    
    const rawBody = await buffer(req);
    let event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Invalid stripe signature" });
        return;
    }

    const type = event.type;
    const data = event.data.object;

    // if a user subscribes, get quantity of subscription

    console.log("webhook received", type, data);


    if(type === "customer.subscription.updated") {
        const items = data.items.data;
        let quantity = 0;
        for(let i = 0; i < items.length; i++) {
            quantity += items[i].quantity;
        }


        const customerId = data.customer;
        const customer = await stripe.customers.retrieve(customerId);
        if(!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }
        const metadata = customer.metadata || {};
        if(!metadata.userId) {
            return res.status(400).json({ message: "No user ID in metadata" });
        }
        const { userId } = metadata;


        const user = await users.getUser(userId);
        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const userMetadata = user.publicMetadata || {};
        userMetadata.seats = quantity;
        userMetadata.subscribed_seats = quantity;
        userMetadata.user_type = quantity > 0 ? "admin" : "user";
        let bills_for = 0;
        // calculate total amount subscription will recurr for
        for(let i = 0; i < items.length; i++) {
            const item = items[i];
            const price = await stripe.prices.retrieve(item.price.id);
            bills_for += price.unit_amount * item.quantity;
        }
        userMetadata.bills_for = bills_for;


        await users.updateUser(userId, {
            publicMetadata: userMetadata,
        });
    } else if(type === "customer.subscription.created") {
        const items = data.items.data;
        let quantity = 0;
        for(let i = 0; i < items.length; i++) {
            quantity += items[i].quantity;
        }
        

        const customerId = data.customer;
        const customer = await stripe.customers.retrieve(customerId);
        if(!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }
        const metadata = customer.metadata || {};
        if(!metadata.userId) {
            return res.status(400).json({ message: "No user ID in metadata" });
        }
        const { userId } = metadata;


        const user = await users.getUser(userId);
        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const userMetadata = user.publicMetadata || {};
        userMetadata.seats = quantity;
        userMetadata.subscribed_seats = quantity;
        userMetadata.user_type = quantity > 0 ? "admin" : "user";
        let bills_on_formattedString = "no subscription";
        if(data.current_period_end) {
            const date = new Date(data.current_period_end * 1000);
            bills_on_formattedString = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
            if(date.getFullYear() !== new Date().getFullYear()) {
                bills_on_formattedString += ", " + date.getFullYear();
            }
        }
        userMetadata.bills_on = bills_on_formattedString;

        let bills_for = 0;
        // calculate total amount subscription will recurr for
        for(let i = 0; i < items.length; i++) {
            const item = items[i];
            const price = await stripe.prices.retrieve(item.price.id);
            bills_for += price.unit_amount * item.quantity;
        }
        userMetadata.bills_for = bills_for;

        await users.updateUser(userId, {
            publicMetadata: userMetadata,
        });
    } else if(type === "customer.subscription.deleted") {


        const customerId = data.customer;
                const customer = await stripe.customers.retrieve(customerId);
        if(!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }
        const metadata = customer.metadata || {};
        if(!metadata.userId) {
            return res.status(400).json({ message: "No user ID in metadata" });
        }
        const { userId } = metadata;


        const user = await users.getUser(userId);
        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const userMetadata = user.publicMetadata || {};


        let subscriptionQuantity = 0;
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
        });

        for(let i = 0; i < subscriptions.data.length; i++) {
            const subscription = subscriptions.data[i];
            const items = subscription.items.data;
            for(let j = 0; j < items.length; j++) {
                subscriptionQuantity += items[j].quantity;
            }
        }

        userMetadata.subscriptionQuantity = subscriptionQuantity;
        userMetadata.seats = quantity;
        userMetadata.subscribed_seats = quantity;
        await users.updateUser(userId, {
            publicMetadata: userMetadata,
        });
    } else if(type === "invoice.paid") {
        /* when subscription is paid & new period starts */
        const customerId = data.customer;
        const customer = await stripe.customers.retrieve(customerId);
        if(!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }
        const metadata = customer.metadata || {};
        if(!metadata.userId) {
            return res.status(400).json({ message: "No user ID in metadata" });
        }
        const { userId } = metadata;

        const user = await users.getUser(userId);
        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const userMetadata = user.publicMetadata || {};
        let bills_on_formattedString = "no subscription";
        if(data.current_period_end) {
            const date = new Date(data.current_period_end * 1000);
            // example "January 4th" (if same year) or "January 4th, 2023" (if different year)
            bills_on_formattedString = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
            if(date.getFullYear() !== new Date().getFullYear()) {
                bills_on_formattedString += ", " + date.getFullYear();
            }
        }
        userMetadata.bills_on = bills_on_formattedString;

        await users.updateUser(userId, {
            publicMetadata: userMetadata,
        });
    }

    res.status(200).json({ received: true });
}