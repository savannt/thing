import mongo from "@/services/mongodb";

import authenticate from "@/services/authenticateRequest";

import executeFlowEvent from "@/services/flow";

export default async function handler(req, res) {
    const { userId } = await authenticate(req, res);
    if(!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const eventName = req.query.eventName.replace(/_/g, "/");
    const chatId = req.query.chatId || false;
    const silent = req.query.silent === "true" || false;
    const speed = parseInt(req.query.speed || "5");

    if(!eventName) return res.status(400).json({ message: "Event name is required" });
    // get body, if not a JSON object throw error

    let payload;
    try {
        payload = JSON.parse(req.body);
    } catch (err) { return res.status(400).json({ message: "Invalid Payload" }); }


    // const response = await executeFlowEvent(chatId, payload, eventName, silent);
    // if(!response) return res.status(400).json({ message: "Error executing event" });
    
    // return res.status(200).json({ message: "Event executed", response });


    executeFlowEvent(chatId, payload, eventName, silent, speed)
    return res.status(200).json({ message: "Event executed" });
}