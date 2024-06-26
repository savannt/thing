import mongo from "@/services/mongodb";

import authenticate from "@/services/authenticateRequest";

export default async function handler(req, res) {
    const { userId } = await authenticate(req, res);
    if(!userId) return res.status(401).json({ error: "Unauthorized" });

    const limit = parseInt(req.query.limit) || 50;
    const title = req.query.title || null;
    const enterpriseId = req.query.enterpriseId || false;

    const { db } = await mongo();
    const groups = db.collection("groups");
    const query = {
        userId,
        enterpriseId,
        deleted: false,
    };
    if(title) query.title = { $regex: title, $options: "i" };

    const groupList = await groups.find(query).sort({ lastTime: -1 }).limit(limit).toArray();
    res.status(200).json(groupList);
}