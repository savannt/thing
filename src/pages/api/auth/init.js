// import { randomHash } from "@/pages/auth";

import mongo from "@/services/mongodb";
import { serialize } from "cookie";

export default async function handler(req, res) {
    function randomHash () {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    const userId = req.query.userId;
    if(!userId) return res.status(400).json({ message: "Invalid userId" });

    const sessionHash = randomHash();
    const data = {
        userId,
        sessionHash,
        lastLogin: new Date(),
    };

    const { client, db } = await mongo();
    const users = db.collection("users");
    
    // check if user exists
    const user = await users.findOne({ userId: data.userId });
    if(user) {
        // update user
        await users.updateOne({ userId: data.userId }, { $set: data });
    } else {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    // res.setHeader("Set-Cookie", `nobusiness.session-hash=${data.sessionHash}; path=/`);
    // res.setHeader("Set-Cookie", `nobusiness.userid=${data.userId}; path=/`);
    // res.setHeader("Set-Cookie", [`nobusiness.userid=${data.userId}; path=/; SameSite=Strict;`, `nobusiness.session-hash=${data.sessionHash}; path=/; SameSite=Strict;`]);
    res.setHeader("Set-Cookie", [serialize("nobusiness.userid", data.userId, {
        path: "/",
        sameSite: "strict",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }), serialize("nobusiness.session-hash", data.sessionHash, {
        path: "/",
        sameSite: "strict",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    })]);
    res.status(200).json({
        sessionHash: data.sessionHash,
        userId: data.userId,
    });
}