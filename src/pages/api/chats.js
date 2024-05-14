import mongo from "@/services/mongodb";

import authenticate from "@/services/authenticateRequest";

export default async function handler(req, res) {
    const { userId } = await authenticate(req, res);
    if(!userId) return;

    const limit = parseInt(req.query.limit) || 50;
    const groupId = req.query.groupId || null;
    const { client, db } = await mongo();


    const chats = db.collection("chats");
    const groups = db.collection("groups");

    const enterpriseId = req.query.enterpriseId || false;
    const query = { userId, enterpriseId, deleted: false };
    if(groupId) query.groupId = groupId;

    const GROUP_LIMIT = 50;
    const CHAT_LIMIT = 50;
   

    if(groupId) {
        const chatList = await chats.find({ userId, enterpriseId, groupId, deleted: false }).sort({ lastMessage: -1 }).limit(CHAT_LIMIT).toArray();
        res.status(200).json(chatList);
    } else {
        const groupList = await groups.find({ enterpriseId, deleted: false }).sort({ lastTime: -1 }).limit(GROUP_LIMIT).toArray();
        const groupedChats = {};
        const ungroupedChats = await chats.find({ userId, enterpriseId, groupId: null, deleted: false }).sort({ lastMessage: -1 }).limit(CHAT_LIMIT).toArray();

        for(let i = 0; i < groupList.length; i++) {
            const group = groupList[i];
            const chatList = await chats.find({ userId, enterpriseId, groupId: group.groupId, deleted: false }).sort({ lastMessage: -1 }).limit(CHAT_LIMIT).toArray();
            groupedChats[group.groupId] = chatList;
        }

        res.status(200).json({
            ...groupedChats,
            ungrouped: ungroupedChats,
        });
    }
}