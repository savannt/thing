const webhookSecret = process.env.VERCEL_WEBHOOK_SECRET;

import { buffer } from "micro";
import crypto from "crypto";

import ably from "@/services/ably";

export default async function handler(req, res) {
    const payload = await buffer(req); //req.body?
    const signature = req.headers["x-vercel-signature"];

    const validSignature = (signature) => {
        const ourSignature = crypto.createHmac("sah1", webhookSecret).update(payload).digest("hex");
        return signature == ourSignature;
    }

    if(!validSignature(signature)) {
        res.status(403).send("Invalid signature");
        return;
    }

    console.log("Valid signature");


    // get ably channel
    const channel = ably.channels.get("deployments");

    const type = req.body.type;
    console.log("type", type);
    console.log("payload", req.body.payload);
    if(req.body.type === "deployment.succeeded") {
        channel.publish("deployment", {
            type: "deployment.succeeded",
            payload: req.body.payload,
        });
    }

    res.status(200).send("OK");
}