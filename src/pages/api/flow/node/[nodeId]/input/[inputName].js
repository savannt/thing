import authenticate from "@/services/authenticateRequest";

import { getInputValue } from "@/services/flow";


import {
    parse as parseNodeId
} from "@/services/nodeId";

export default async function handler(req, res) {
    const { userId } = await authenticate(req, res);
    if(!userId) return res.status(401).json({ message: "Unauthorized" });


    const { nodeId: strNodeId, inputName, chatId } = req.query;
    if(!strNodeId) return res.status(400).json({ message: "Node ID is required" });
    const nodeId = parseNodeId(strNodeId);
    if(!nodeId) return res.status(400).json({ message: "Node ID is required" });

    if(!inputName) return res.status(400).json({ message: "Input Name is required" });
    if(!chatId) return res.status(400).json({ message: "Chat ID is required" });

    const inputValueResponse = await getInputValue(chatId, nodeId, inputName);
    if(!inputValueResponse) return res.status(400).json({ message: "Error getting input value" });


    if(inputValueResponse.error) return res.status(400).json({ message: inputValueResponse.error });
    if(!inputValueResponse.value) return res.status(400).json({ message: "Input not found" });

    return res.status(200).json({ value: inputValueResponse.value });
}