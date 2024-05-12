import mongo  from "@/services/mongodb";
import { Assistant } from "@/services/openai/OpenAI.js";
import { generateGroupId } from "@/services/generator";

import authenticate from "@/services/authenticateRequest";

export default async function handler(req, res) {
    const didAuthenticate = await authenticate(req, res);
    if(!didAuthenticate) return;
    const userId = didAuthenticate.userId;

    const params = req.query.groupId || [];
    if(params.length === 0) return res.status(400).json({ message: "Invalid groupId" });

    const groupId = params[0];
    const operation = params[1] || false;

    const enterpriseId = req.query.enterpriseId || false;

    const { db } = await mongo();


    
    if(groupId === "new") {
        const title = req.query.title || "New Untitled Group " + /* random large number */ Math.floor(Math.random() * 1000000);
        
        const assistant = await Assistant.create("An AI Assistant", "Act as extremely rude and arrogant AI Assistant");
        if(!assistant) return res.status(500).json({ message: "Failed to create AI Assistant" });
        const assistantId = assistant.id;

        const data = {
            userId,
            title,
            groupId: generateGroupId(),
            enterpriseId,
            assistantId,
            deleted: false,
            lastTime: new Date(),
        };

        const groups = db.collection("groups");
        await groups.insertOne(data);
        
        res.status(200).json(data);
        return;
    } else if(!operation) {
        const groups = db.collection("groups");
        const group = await groups.findOne({ groupId, deleted: false });
        if(!group) return res.status(404).json({ message: "Group not found" });
        if(group.userId !== userId) return res.status(401).json({ message: "Unauthorized" });
        
        res.status(200).json(group);
        return;
    } else if(operation === "delete") {
        // mark deleted: true
        const groups = db.collection("groups");
        const group = await groups.findOne({ groupId, deleted: false });
        if(group.userId !== userId) return res.status(401).json({ message: "Unauthorized" });

        await groups.updateOne({ groupId }, { $set: { deleted: true } });

        // delete any chats with this groupId
        const chats = db.collection("chats");
        await chats.updateMany({ groupId, deleted: false }, { $set: { deleted: true } });

        res.status(200).json({ message: "OK" });
        return;
    } else {
        res.status(400).json({ message: "Invalid operation" });
        return;
    }
}