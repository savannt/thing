// import { randomHash } from "@/pages/auth";

import mongo from "@/services/mongodb";
// import { serialize } from "cookie";

import { getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
    const { userId } = getAuth(req);
    if(!userId) return res.status(401).json({ error: "Unauthorized" });
    
    

    res.status(200).json({
        userId,
    });
}