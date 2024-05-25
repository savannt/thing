import mongo from "@/services/mongodb";
import ably from "@/services/ably";

import NodeDictionary from "@/app/Chat/ChatGraph/Flow/NodeDictionary";
import BackendNodeDictionary from "@/app/Chat/ChatGraph/Flow/BackendNodeDictionary";

// {
//     "nodes": [
//       {
//         "type": "EventNode",
//         "data": {
//           "displayName": "On User Message",
//           "category": "Event",
//           "label": "onUserMessage",
//           "details": "event",
//           "out": {
//             "message": {
//               "type": "message",
//               "description": "User message"
//             },
//             "attachments": {
//               "type": "array",
//               "description": "Attachments"
//             }
//           }
//         },
//         "draggable": true,
//         "position": {
//           "x": 1167.8660433083728,
//           "y": 63.63168540861412
//         },
//         "name": "OnUserMessage",
//         "id": "OnUserMessagef90b4",
//         "width": 154,
//         "height": 124,
//         "selected": false,
//         "positionAbsolute": {
//           "x": 1167.8660433083728,
//           "y": 63.63168540861412
//         },
//         "dragging": false
//       },
//       {
//         "type": "FunctionNode",
//         "data": {
//           "displayName": "Save Message",
//           "category": "Function",
//           "label": "Save Message",
//           "details": "function",
//           "in": {
//             "message": {
//               "type": "message",
//               "description": "Message to save"
//             }
//           }
//         },
//         "draggable": true,
//         "position": {
//           "x": 1553.2278129290926,
//           "y": 152.74519518592473
//         },
//         "name": "SaveMessage",
//         "id": "SaveMessagezdjlve",
//         "width": 154,
//         "height": 93,
//         "selected": true,
//         "positionAbsolute": {
//           "x": 1553.2278129290926,
//           "y": 152.74519518592473
//         },
//         "dragging": false
//       }
//     ],
//     "edges": [
//       {
//         "source": "OnUserMessagef90b4",
//         "sourceHandle": "message",
//         "target": "SaveMessagezdjlve",
//         "targetHandle": "message",
//         "type": "DataEdge",
//         "data": {
//           "type": "message"
//         },
//         "id": "reactflow__edge-OnUserMessagef90b4message-SaveMessagezdjlvemessage"
//       }
//     ]
//   }


export async function onUserMessage (chatId, message) {
    return await executeFlowEvent(chatId, { message }, "OnUserMessage");
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
        console.error(title, message);
    }
    const flowForType = (type) => {
        if(type === "EventNode") return { input: false, output: true };
        if(type === "FunctionNode") return { input: true, output: true };
        if(type === "ConstantNode") return { input: false, output: false };
        if(type === "LogicNode") return { input: false, output: false };
    
        return handleError("Unknown node type", type);
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

    
    if(nodes.length === 0) return handleError("No nodes", "No nodes found in group");
    if(!hasEventNode) return handleError(`${eventName} not found`, `Event node ${eventName} not found in group`);
    
    for(const key in values) {
        if(!eventNode.data.out[key]) return handleError("Invalid value", `Value ${key} not found in event node ${eventName}`);
    }


    let contexts = {};



    const handleFlowIteration = async (node, initialValues) => {
        if(!node) {
            return handleError("No node");
        }

        await flowChannel.publish("execute", {
            nodeId: node.id,
        });
        
        const getEdge = (dataType) => {
            return edges.find(edge => edge.source === node.id && edge.data.type === dataType);
        }

        const nodeName = node.name;
        const nodeType = node.type;

        if(!nodeType) return handleError("Node has no type", nodeName, {
            nodeId: node.id,
        });

        const {
            input: hasInputFlow,
            output: hasOutputFlow
        } = flowForType(nodeType);

        if(!hasOutputFlow) {
            return handleError("Node has no output", nodeName, {
                nodeId: node.id,
            });
        }

        
        const outputFlowEdge = getEdge("execution");
        const hasOutputFlowEdge = !!outputFlowEdge;
        const canBeFinalNode = node.data?.final || false;
        const nextNode = hasOutputFlowEdge ? nodes.find(node => node.id === outputFlowEdge.target) : false;

        // console.log("NODES", nodes);
        // console.log("EDGES", edges);

        const executeNode = async (id, initialValues = []) => {
            await flowChannel.publish("execute", {
                nodeId: id,
            });
            
            const node = nodes.find(node => node.id === id);

            const inputs = node.data?.in || {};
            const outputs = node.data?.out || {};

            const inputEdges = edges.filter(edge => edge.target === node.id && edge.type === "DataEdge");
            
            // check if we are missing any input values
            for(const key in inputs) {
                const required = inputs[key].required || true;
                const type = inputs[key].type;
                const edge = inputEdges.find(edge => edge.data.type === type);
                if(!edge) {
                    if(required) {                        
                        return handleError("Missing required input", `${key}`, {
                            nodeId: node.id,
                        });
                    }
                }
            }
            
            
            let inputValues = initialValues;
            for(const edge of inputEdges) {
                const edgeId = edge.id;

                if(!contexts[edgeId]) {
                    // get the source node
                    const sourceNode = nodes.find(node => node.id === edge.source);

                    await flowChannel.publish("execute_edge", {
                        edgeId,
                    });

                    // console.log("sourceNode", sourceNode, edge, edge.source, nodes);
                    // execute the source node
                    await executeNode(sourceNode.id);
                    
                    // now it's value should be in contexts
                    if(!contexts[edgeId]) {
                        return handleError("No context for", edgeId, {
                            edgeId
                        });
                    }
                }

                inputValues.push(contexts[edgeId]);
            }

            
            const handler = BackendNodeDictionary[node.name];
            const outputValues = await handler(inputValues);
            // console.log("inputValues", inputValues, "outputValues", outputValues);

            for(const key in outputs) {
                const type = outputs[key].type;
                const required = outputs[key].required || true;

                // find output edge id
                if(!outputValues[key]) return handleError(`Missing output value`, `${node.name} did not compile a ${key} output`, {
                    nodeId: node.id,
                    valueName: key
                });

                const outputEdge = edges.find(edge => edge.source === node.id && edge.data.type === type);
                if(!outputEdge && required) return handleError(`Missing connection`, `${node.name}'s ${key} is a required output`, {
                    nodeId: node.id,
                    valueName: key
                });

                contexts[outputEdge.id] = outputValues[key];
            }

            await flowChannel.publish("execute_response", {
                nodeId: node.id,
                values: outputValues,
            });

            return true;
        }

        // Execute this node's handler
        // If it has an input this needs computed- it does this backwards within this execution
        await executeNode(node.id, initialValues);

        if(!nextNode && !canBeFinalNode) {
            return handleError("Flow unexpectedly ended", `No next node after ${node.name}`, {
                nodeId: node.id,
            });
        } else if(!nextNode && canBeFinalNode) {
            return contexts;
        }

        console.log("Executing", node, "with output flow to", nextNode);

        if(outputFlowEdge) {
            await flowChannel.publish("execute_edge", {
                edgeId: outputFlowEdge.id,
            });
        }

        return await handleFlowIteration(nextNode);
    }

    await handleFlowIteration(eventNode, values);

    return contexts;
}