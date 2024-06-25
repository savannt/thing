import {
    stringify as stringifyNodeId
} from "@/services/nodeId";

export default async function nodeInputValue(chatId, nodeId, inputName) {
    if(!chatId) throw new Error("Chat ID is required");
    if(!nodeId) throw new Error("Node ID is required");
    if(!inputName) throw new Error("Input Name is required");

    const response = await fetch(`/api/flow/node/${stringifyNodeId(nodeId)}/input/${inputName}?chatId=${chatId}`);
    if(response.status !== 200) return false;
    const data = await response.json();
    if(!data.value) return false;
    return data.value;
}