import mongo  from "@/services/mongodb";
import { generateChatId } from "@/services/generator";

import authenticate from "@/services/authenticateRequest";
import { onChatCreated } from "@/services/flow";

export default async function handler(req, res) {
    const didAuthenticate = await authenticate(req, res);
    if(!didAuthenticate) return;
    const userId = didAuthenticate.userId;

    const params = req.query.chatId || [];
    if(params.length === 0) return res.status(400).json({ message: "Invalid chatId" });

    const chatId = params[0];
    const operation = params[1] || false;
    const enterpriseId = req.query.enterpriseId || false;
    const groupId = req.query.groupId || null;

    const { client, db } = await mongo();

    if(chatId === "new") {
        const data = {
            userId,
            title: "Untitled Chat " + /* random large number */ Math.floor(Math.random() * 1000000),
            messagesSinceTitleUpdate: -1,
            chatId: generateChatId(),
            groupId,
            enterpriseId,
            lastMessage: new Date(),
            injectedMessages: [],
            messages: [],
            // rawMessages: [],
            deleted: false,

            typing: false,
            locked: false,
            waitingForResponse: false,
            waitingForResponseChoices: [],
        };

        const chats = db.collection("chats");
        await chats.insertOne(data);

        // redirect to /chat/[chatId]
        // res.redirect(307, `/chat/${data.chatId}`);
        
        onChatCreated(data.chatId);

        res.status(200).json(data);
        return;
    } else if(!operation) {
        const chats = db.collection("chats");
        const chat = await chats.findOne({ chatId, deleted: false });
        if(!chat) return res.status(404).json({ message: "Chat not found" });
        if(chat.userId !== userId) return res.status(401).json({ message: "Unauthorized" });
        
        res.status(200).json(chat);
        return;
    } else if(operation === "delete") {
        // mark deleted: true
        const chats = db.collection("chats");
        const chat = await chats.findOne({ chatId, deleted: false });
        if(chat.userId !== userId) return res.status(401).json({ message: "Unauthorized" });

        await chats.updateOne({ chatId }, { $set: { deleted: true } });

        res.status(200).json({ message: "OK" });
        return;
    } else {
        res.status(400).json({ message: "Invalid operation" });
        return;
    }
}


// Long Polling Scheme:
// * Always have long-poll polled, always send what you have
// * If something changes between long-poll response and the new long-poll it's caught in the what-you-have query