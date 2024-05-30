
import Flow, { DEFAULT_OUTPUTS_REQUIRED } from "@/services/flow/Flow";

import mongo from "@/services/mongodb";
import ably from "@/services/ably";






export async function onUserMessage (chatId, message) {
    return await executeFlowEvent(chatId, { message, chatId }, "OnUserMessage");
}

export async function onChatCreated (chatId) {
    return await executeFlowEvent(chatId, {}, "OnChatCreated");
}

export default async function executeFlowEvent (chatId, values = {}, eventName = "OnUserMessage") {
    const { db } = await mongo();
    const flowChannel = ably.channels.get(`flow-${chatId}`);
    
    const handleError = async (title, message, options) => {
        await flowChannel.publish("error", {
            title,
            message,
            options
        });
    }
    const handleLog = async (...messages) => {
        await flowChannel.publish("log", { messages });
    }
    const handleExecute = async (nodeId, defaultOutputValues) => {
        await flowChannel.publish("execute", { nodeId, defaultOutputValues });
    }
    const handleExecuteResponse = async (nodeId, outputValues) => {
        await flowChannel.publish("execute_response", { nodeId, outputValues });
    }
    const handleEdgeExecute = async (edgeId, value) => {
        await flowChannel.publish("execute_edge", { edgeId, value });
    }
    const handleEdgeOn = async (edgeId) => {
        await flowChannel.publish("edge_on", { edgeId });
    }
    const handleEdgeOff = async (edgeId) => {
        await flowChannel.publish("edge_off", { edgeId });
    }
    const handleFinish = async () => {
        await flowChannel.publish("finish", {});
    }

    const chats = db.collection("chats");
    const groups = db.collection("groups");
    const chat = await chats.findOne({ chatId, deleted: false });
    if(!chat) return { message: "Chat not found" };
    const groupId = chat.groupId;
    const enterpriseId = chat.enterpriseId;
    const group = await groups.findOne({ groupId });
    if(!group) return { message: "Group not found" };

    const nodes = group.nodes;
    const edges = group.edges;

    const eventNode = nodes.find(node => node.name === eventName);
    const hasEventNode = !!eventNode;

    // if no nodes
    if(nodes.length === 0) return handleError("No nodes", "No nodes found in group");
    // if no event node
    if(!hasEventNode) return handleError(`${eventName} not found`, `Event node ${eventName} not found in group`);
    
    // for each initial value check if this value is a real output of the event node
    for(const key in values) { if(!eventNode.data.out[key]) return handleError("Invalid value", `Value ${key} not found in event node ${eventName}`); }
    
    // for each outputs of the event node check if this value is in the initial values if required
    for(const key in eventNode.data?.out || {}) {
        const required = eventNode.data.out[key].required || DEFAULT_OUTPUTS_REQUIRED;
        if(!values[key] && required) return handleError("Missing required initial value", `Value ${key} is required but not found in initial values`);
    }



    const flow = new Flow({ nodes, edges });
    flow.onError((title, message, options) => handleError(title, message, options));
    flow.onLog((...messages) => handleLog(...messages));
    flow.onExecute((nodeId, defaultOutputValues) => handleExecute(nodeId, defaultOutputValues));
    flow.onExecuteResponse((nodeId, outputValues) => handleExecuteResponse(nodeId, outputValues));
    flow.onEdgeExecute((edgeId, value) => handleEdgeExecute(edgeId, value));
    flow.onEdgeOn((edgeId) => handleEdgeOn(edgeId));
    flow.onEdgeOff((edgeId) => handleEdgeOff(edgeId));
    flow.onFinish(() => handleFinish());

    const outputValues = await flow.executeFlowEvent(eventName, values);
    return outputValues;
}