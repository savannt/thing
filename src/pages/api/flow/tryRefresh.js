import authenticate from "@/services/authenticateRequest";

import NodeManager from "@/services/flow/node/NodeManager";
const nodeManager = new NodeManager();

export default async function handler(req, res) {
    const { userId } = await authenticate(req, res);
    if(!userId) return res.status(401).json({ message: "Unauthorized" });

    await nodeManager.saveNodes();
    return res.status(200).json({ message: "Nodes refreshed" });
}