
import Flow, { DEFAULT_OUTPUTS_REQUIRED } from "@/services/flow/Flow";

import mongo from "@/services/mongodb";
import ably from "@/services/ably";






export async function onUserMessage (chatId, message) {
	return await executeFlowEvent(chatId, { message, chatId }, "Events/OnUserMessage");
}

export async function onChatCreated (chatId) {
	return await executeFlowEvent(chatId, {}, "Events/OnChatCreated", true);
}

export default async function executeFlowEvent (chatId, values = {}, eventName = "Events/OnUserMessage", silent = false, speed = 5) {
	console.log("USING SPEED", speed);

	const { db } = await mongo();
	const flowChannel = ably.channels.get(`flow-${chatId}`);
	
	const _throttle = async () => {
		let waitTime = (5 - speed) * 250;
		if(waitTime === 0) return;
		await new Promise(resolve => setTimeout(resolve, waitTime));
	}

	const handleError = async (title, message, options) => {
		if(silent) return;
		flowChannel.publish("error", {
			title,
			message,
			options
		});
		await _throttle();
	}
	const handleLog = async (...messages) => {
		flowChannel.publish("log", { messages });
		await _throttle();
	}
	const handleExecute = async (nodeId, defaultOutputValues) => {
		flowChannel.publish("execute", { nodeId, defaultOutputValues });
		await _throttle();
	}
	const handleExecuteResponse = async (nodeId, outputValues) => {
		flowChannel.publish("execute_response", { nodeId, outputValues });
		await _throttle();
	}
	const handleEdgeExecute = async (edgeId) => {
		flowChannel.publish("execute_edge", { edgeId });
		await _throttle();
	}
	const handleEdgeExecuteResponse = async (edgeId, value) => {
		flowChannel.publish("execute_edge_response", { edgeId, value });
		await _throttle();
	}
	const handleEdgeBackwards = async (edgeId) => {
		flowChannel.publish("execute_edge_backwards", { edgeId });
		await _throttle();
	}
	const handleBackwards = async (nodeId) => {
		flowChannel.publish("execute_backwards", { nodeId });
		await _throttle();
	}
	const handleStart = async () => {
		flowChannel.publish("start", {});
		await _throttle();
	}
	const handleFinish = async (success) => {
		flowChannel.publish("finish", { success });
		await _throttle();
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
		const required = typeof eventNode.data.out[key].required !== "undefined" ? eventNode.data.out[key].required : DEFAULT_OUTPUTS_REQUIRED;
		if(!values[key] && required) {
			await handleError("Missing required initial value", `Value ${key} is required but not found in initial values`);
			return handleFinish(false);
		}
	}



	const flow = new Flow({ nodes, edges });
	flow.setGlobals({ chatId, enterpriseId, groupId });

	flow.onStart(() => handleStart());
	flow.onError((title, message, options) => handleError(title, message, options));
	flow.onLog((...messages) => handleLog(...messages));
	flow.onExecute((nodeId, defaultOutputValues) => handleExecute(nodeId, defaultOutputValues));
	flow.onExecuteResponse((nodeId, outputValues) => handleExecuteResponse(nodeId, outputValues));
	flow.onEdgeExecute((edgeId) => handleEdgeExecute(edgeId));
	flow.onEdgeExecuteResponse((edgeId, value) => handleEdgeExecuteResponse(edgeId, value));
	flow.onEdgeBackwards((edgeId) => handleEdgeBackwards(edgeId));
	flow.onBackwards((nodeId) => handleBackwards(nodeId));
	flow.onFinish((success) => handleFinish(success));
	
	await flow.updateNodesData();
	const outputValues = await flow.executeFlowEvent(eventName, values);
	if(!outputValues) return handleFinish(false);
	return outputValues;
}