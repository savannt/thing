import "colors";

export const DEFAULT_INPUTS_REQUIRED = true;
export const DEFAULT_OUTPUTS_REQUIRED = true;

export const HANDLER_TIMEOUT = 10000;

import NodeDictionary from "./NodeDictionary.js";
import NodeHandlerDictionary from "./NodeHandlerDictionary.js";

export default class Flow {
    constructor (nodesObject) {
        if(!nodesObject.nodes) throw new Error("Nodes object is required");
        if(!nodesObject.edges) throw new Error("Edges object is required");

        this.nodes = nodesObject.nodes;
        this.edges = nodesObject.edges;

        this.context = {};
    }

    async getExecutionFlowsForType (type) {
        if(type === "EventNode") return { input: false, output: true };
        if(type === "FunctionNode") return { input: true, output: true };
        if(type === "ConstantNode") return { input: false, output: false };
        if(type === "LogicNode") return { input: false, output: false };
        if(type === "EndNode") return { input: true, output: false };
    
        return handleError("Unknown node type", type);
    }

    async onLog (callback) {
        this._onLog = callback;
    }

    async onError (callback) {
        this._onError = callback;
    }

    async onExecute (callback) {
        this._onExecute = callback;
    }

    async onExecuteResponse (callback) {
        this._onExecuteResponse = callback;
    }

    async onEdgeExecute (callback) {
        this._onEdgeExecute = callback;
    }

    async onEdgeExecuteResponse (callback) {
        this._onEdgeExecuteResponse = callback;
    }

    async onEdgeBackwards (callback) {
        this._onEdgeBackwards = callback;
    }

    async onBackwards (callback) {
        this._onBackwards = callback;
    }

    async onFinish (callback) {
        this._onFinish = callback;
    }

    // message that sends error to client
    async handleError (title, message, options) {
        if(this._onError) await this._onError(title, message, options);
        console.error(title + ":  ", message);
        return false;
    }

    async handleLog (...args) {
        if(this._onLog) await this._onLog(...args);
        // if any args is json, stringify it inline
        // console.log(...args);
        console.log(...args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : arg));
    }

    async handleExecute (nodeId, defaultOutputValues = {}) {
        if(this._onExecute) await this._onExecute(nodeId, defaultOutputValues);
        console.log("Starting execution".gray, nodeId, "with default output values".gray, defaultOutputValues);
    }

    async handleExecuteResponse (nodeId, outputValues) {
        if(this._onExecuteResponse) await this._onExecuteResponse(nodeId, outputValues);
        console.log("Executed".gray.italic, nodeId, "with output values".gray.italic, JSON.stringify(outputValues));
    }

    async handleEdgeExecute (edgeId) {
        if(this._onEdgeExecute) await this._onEdgeExecute(edgeId);
        console.log("Edge executed".blue, edgeId);
    }

    async handleEdgeExecuteResponse (edgeId, value) {
        if(this._onEdgeExecuteResponse) await this._onEdgeExecuteResponse(edgeId, value);
        console.log("Edge executed response".blue.italic, edgeId, "with value".blue.italic, JSON.stringify(value));
    }

    async handleEdgeBackwards (edgeId) {
        if(this._onEdgeBackwards) await this._onEdgeBackwards(edgeId);
        console.log("Edge backwards".yellow, edgeId);
    }

    async handleBackwards (nodeId) {
        if(this._onBackwards) await this._onBackwards(nodeId);
        console.log("Backwards".yellow, nodeId);
    }
    
    async handleFinish () {
        if(this._onFinish) await this._onFinish();
        console.log("Flow finished".green.bold.italic);
    }

    async updateNodesData () {
        // for each node- update it's data component with data from NodeDictionary  (don't touch data.name)
        for(const node of this.nodes) {
            const nodeProto = NodeDictionary[node.name];
            if(!nodeProto) return await this.handleError("Node not found in dictionary", node.name);
            const nodeDataProto = nodeProto.data;

            
            node.data = {
                ...node.data,
                ...nodeDataProto,
                name: node.name
            };
        }

    }

    getInputExecutionEdges (node) {
        return this.edges.filter(edge => edge.target === node.id && (edge.type === "ExecutionEdge" || edge.data.type.startsWith("execution-")));
    }

    getOutputExecutionEdges (node) {
        return this.edges.filter(edge => edge.source === node.id && (edge.type === "ExecutionEdge" || edge.data.type.startsWith("execution-")));
    }

    getInputEdges (node) {
        return this.edges.filter(edge => edge.target === node.id && edge.type === "DataEdge" && !edge.data.type.startsWith("execution-"));
    }

    getOutputEdges (node) {
        return this.edges.filter(edge => edge.source === node.id && edge.type === "DataEdge" && !edge.data.type.startsWith("execution-"));
    }

    async isNodeValid (node) {
        if(!node) return await this.handleError("Node not found", `Node ${id} not found`);
        
        const nodeType = node.type;

        const inputs = node.data?.in || {};
        const outputs = node.data?.out || {};

        const inputEdges = this.edges.filter(edge => edge.target === node.id && edge.type === "DataEdge");
        const inputExecutionEdges = this.getInputExecutionEdges(node);
        const outputEdges = this.edges.filter(edge => edge.source === node.id && edge.type === "DataEdge");
        const outputExecutionEdges = this.getOutputExecutionEdges(node);

        for(const key in inputs) {
            const required = inputs[key].required || DEFAULT_INPUTS_REQUIRED;
            const type = inputs[key].type;
            const edge = inputEdges.find(edge => {
                if(!edge.data.type.includes(":")) return edge.data.type === type;    
                else {
                    const edgeType = edge.data.type.split(":")[0];
                    const edgeParamName = edge.data.type.split(":")[1];
    
                    return edgeType === type;
                }
            });
            if(!edge) {
                if(required) {
                    return await this.handleError("Missing required input", `${key}`, {
                        nodeId: node.id,
                    });
                }
            }
        }

        const handleOutputs = async (outputs) => {
            for(const key in outputs) {
                const type = outputs[key].type;

                if(type === "group") {
                    const groupOutputs = outputs[key].out || {};
                    const handledGroupOutputs = await handleOutputs(groupOutputs);
                    if(!handledGroupOutputs) return false;

                    const groupHasFlow = outputs[key].flow || false;
                    if(groupHasFlow) {
                        // look for handle "execution-[key]"
                        const groupFlowEdge = this.edges.filter(edge => edge.source === node.id && edge.data.type === `execution-${key}`);
                        if(!groupFlowEdge) {
                            return await this.handleError("Missing required group flow output", key, {
                                nodeId: node.id,
                            });
                        }
                    }
                } else {
                    const required = typeof outputs[key].required === "undefined" ? DEFAULT_OUTPUTS_REQUIRED : outputs[key].required;
                    const edge = outputEdges.find(edge => {
                        if(!edge.data.type.includes(":")) return edge.data.type === type;    
                        else {
                            const edgeType = edge.data.type.split(":")[0];
                            const edgeParamName = edge.data.type.split(":")[1];
            
                            return edgeType === type;
                        }
                    });
                    
                    if(!edge && required) {
                        return await this.handleError("Missing required output", `${key}`, {
                            nodeId: node.id,
                        });
                    }
                }
            }

            return true;
        }

        
        let handledOutputs = await handleOutputs(outputs);
        if(!handledOutputs) return false;
        
        const executionFlows = await this.getExecutionFlowsForType(nodeType);
        if(executionFlows.output) {
            // check if we are outputting an execution edge- if not and data.final is not set- then we have an error
            if(!outputExecutionEdges.length && !node.data?.final) {
                return await this.handleError("Node cannot be final", `Node ${node.name} has no output execution`, {
                    nodeId: node.id,
                });
            }
        }

        if(executionFlows.input) {
            // check if we are inputting an execution edge- if not and data.final is not set- then we have an error
            if(!inputExecutionEdges.length) {
                return await this.handleError("Node is not being called", `Node ${node.name} has no input execution`, {
                    nodeId: node.id,
                });
            }
        }

        return true;
    }

    async executeNode (id, defaultOutputValues = {}, isBackwards = false) {
        const node = this.nodes.find(node => node.id === id);
        if(!node) return await this.handleError("Node not found", `Node ${id} not found`);

        // ping execution event to client
        if(isBackwards) {
            await this.handleBackwards(id);
        } else {
            await this.handleExecute(id, defaultOutputValues);
        }
        // 


        // verify node is valid
        const isValidNode = await this.isNodeValid(node);
        if(!isValidNode) return false;




        const inputs = node.data?.in || {};
        const outputs = node.data?.out || {};

        const inputEdges = this.getInputEdges(node);
        const outputEdges = this.getOutputEdges(node);





        // for each input edge- check if we have a saved value for it-  otherwise we need to execute the source node first before proceeding
        // (save edge values to this.context[edgeId])
        
        let inputValues = {}; 
        for(const edge of inputEdges) {
            const edgeId = edge.id;
            if(!this.context[edgeId]) {
                let idSplits = edge.id.split(":");
                const backwardsParamName = idSplits[idSplits.length - 1];
                
                this.handleEdgeBackwards(edgeId);
                // this.handleLog("Must backwards generate input".yellow, backwardsParamName, { edgeId, nodeId: node.id });

                // get the source node (go backwards on this input)
                const sourceNode = this.nodes.find(node => node.id === edge.source);
                if(!sourceNode) return await this.handleError("No backwards node for input", backwardsParamName, { edgeId, nodeId: node.id });

                // execute the source node
                await this.executeNode(sourceNode.id, {}, true);
                // now it's value should be in contexts
                if(!this.context[edgeId]) return await this.handleError("Node failed to generate input", backwardsParamName, { edgeId, nodeId: node.id });
            }
            
            // console.log(edge);
            // TOOD: FINISH HERE, set inputValues[????] = this.context[edgeId]
         
            

            let edgeSplits = edge.id.split(":");
            const edgeParamName = edgeSplits[edgeSplits.length - 1];
                        
            inputValues[edgeParamName] = this.context[edgeId];
        }

        if(isBackwards) {
            await this.handleExecute(node.id);
        }


        // check if we are missing any required input values
        for(const key in inputs) {
            const required = typeof inputs[key].required === "undefined" ? DEFAULT_INPUTS_REQUIRED : inputs[key].required;
            if(!inputValues[key] && required) return await this.handleError("Missing required input", `${key}`, { nodeId: node.id });
        }


        if(defaultOutputValues) inputValues = { ...inputValues, ...defaultOutputValues };

        this.handleLog("Executing node".gray, node.id, "with input values".gray, inputValues);

        // execute the node's handler
        const handler = NodeHandlerDictionary[node.name];
        if(!handler) return await this.handleError("Handler not found", `Handler for node ${node.name} not found`);
        
        


        // const outputValues = await handler(inputValues);

        // do the above but have a timeout
        const handlerPromise = new Promise(async (resolve) => {
            let handlerTimeout = setTimeout(() => {
                resolve(false);
            }, HANDLER_TIMEOUT);

            try {
                const outputValues = await handler(inputValues);
                clearTimeout(handlerTimeout);
                resolve(outputValues);
            } catch (error) {
                clearTimeout(handlerTimeout);
                reject(error);
            }
        });

        const outputValues = await handlerPromise;
        if(!outputValues) {
            return await this.handleError("Handler timeout", `Handler for node ${node.name} timed out`, { nodeId: node.id });
        }





        if(outputValues && outputValues.error) {
            let { title, messages } = outputValues.error;
            if(!title) title = "Handler error";
            if(!messages) messages = [outputValues.error];
            const messagesStr = messages.join(", ");
            return await this.handleError(title, messagesStr, { nodeId: node.id });
        }

        if(!outputValues) return await this.handleError("Handler failed to generate output", "No output values generated", { nodeId: node.id });



        const handleOutputs = async (node, outputs, outputValues) => {
            for (const key in outputs) {
                const type = outputs[key].type;
    
                if (type === "group") {
                    const groupOutputs = outputs[key].out || {};
                    // console.log("HANDLING GROUP", key, groupOutputs, outputValues);
                    const handledGroupOutputs = await handleOutputs(node, groupOutputs, outputValues);
                    if (!handledGroupOutputs) return false;
    
                    const groupHasFlow = outputs[key].flow || false;
                    if (groupHasFlow) {
                        // look for handle "execution-[key]"
                        const groupFlowEdge = this.edges.filter(edge => edge.source === node.id && edge.data.type === `execution-${key}`);
                        if (!groupFlowEdge) {
                            return await this.handleError("Missing required group flow output", `${key}`, {
                                nodeId: node.id,
                            });
                        }


                        // // execute this flow
                        // const groupFlowEdgeId = groupFlowEdge[0].id;
                        // await this.handleEdgeExecute(groupFlowEdgeId, outputValues[key]);

                        // execute the group flow node
                        await this._executeFlowEvent(node, key, {});
                    }
                } else {
                    // console.log("OUTPUTS", key, outputValues);
                    const required = typeof outputs[key].required === "undefined" ? DEFAULT_OUTPUTS_REQUIRED : outputs[key].required;
                    if (!outputValues[key] && required) await this.handleLog("Handler", handler.toString(), "failed to generate output", key, outputValues);
                    if (!outputValues[key] && required) return await this.handleError("Handler failed to generate output", `${key}`, { nodeId: node.id });
    
                    const outputEdge = outputEdges.find(edge => edge.data.type.split(":")[1] === key);
                    if (outputEdge) {
                        // TODO: only execute this edge if our next node = otuputEdge.target
                        // const nextNode = await this.nextNode(node);
                        // if (nextNode && nextNode.id === outputEdge.target) {
                            // await this.handleEdgeExecute(outputEdge.id, outputValues[key]);
                        // }
                        await this.handleEdgeExecute(outputEdge.id, outputValues[key]);
                        this.context[outputEdge.id] = outputValues[key];
                    }
                }
            }
    
            return true;
        };
    
        // console.log("BEFORE OUTPUTS", outputs, outputValues);

        // Process and save output values
        const handledOutputs = await handleOutputs(node, outputs, outputValues);
        if (!handledOutputs) return false;

        

        const primaryNextNodeFlowEdge = this.edges.find(edge => edge.source === node.id && edge.type === "ExecutionEdge");
        if(primaryNextNodeFlowEdge) {
            await this.handleEdgeExecute(primaryNextNodeFlowEdge.id);
        }


    
        // console.log("AFTER OUTPUTS", outputs, outputValues, handledOutputs);

        await this.handleExecuteResponse(node.id, outputValues);
    
        // For each output edge, set response
        for (const edge of outputEdges) {
            const edgeId = edge.id;
            await this.handleEdgeExecuteResponse(edgeId, outputValues[edge.data.type.split(":")[1]]);
        }

        // get any input flows and set their response
        const primaryPreviousNodeFlowEdge = this.edges.find(edge => edge.target === node.id && edge.type === "ExecutionEdge");
        if(primaryPreviousNodeFlowEdge) {
            await this.handleEdgeExecuteResponse(primaryPreviousNodeFlowEdge.id);
        }
    
        return true;



        // // check output values against outputs keyName: { type, required, description }
        // for(const key in outputs) {
        //     const type = outputs[key].type;
        //     const required = typeof outputs[key].required === "undefined" ? DEFAULT_OUTPUTS_REQUIRED : outputs[key].required;

        //     if(!outputValues[key] && required) await this.handleLog("Handler", handler.toString(), "failed to generate output", key, outputValues);
        //     if(!outputValues[key] && required) return await this.handleError("Handler failed to generate output", `${key}`, { nodeId: node.id });
        // }

        // // save output values to this.context[outputEdgeId]
        // for(const key in outputs) {
        //     // console.log("key", key);

            
        //     const outputEdge = outputEdges.find(edge => {
        //         return edge.data.type.split(":")[1] === key;
        //     });
        //     if(outputEdge) {
        //         await this.handleEdgeExecute(outputEdge.id, outputValues[key]);
        //         this.context[outputEdge.id] = outputValues[key];
        //     }
        //     // console.log("outputEdge", outputEdge);
        //     // this.context[outputEdge.id] = outputValues[key];
        // }


        // await this.handleExecuteResponse(node.id, outputValues);
        
        // // for each output edges set response
        // for(const edge of outputEdges) {
        //     const edgeId = edge.id;
        //     await this.handleEdgeExecuteResponse(edgeId, outputValues[edge.data.type.split(":")[1]]);
        // }

        // // console.log("context", this.context);

        // return true;
    }

    async nextNode (node, eventName = false) {
        if(eventName && eventName ===  node.name) eventName = false;
        const outputExecutionEdges = this.edges.filter(edge => {
            if(!eventName) {
                return edge.source === node.id && edge.type === "ExecutionEdge";
            } else {
                if(edge.source === node.id) {
                    // console.log(edge);
                    if(edge.data.type === `execution-${eventName}`) {
                        return true;
                    }
                }
                return false;
            }
        });
        if(outputExecutionEdges.length === 0) return false;

        const nextNode = this.nodes.find(node => node.id === outputExecutionEdges[0].target);
        return nextNode;
    }

    getConnectingFlowEdge (nodeSource, nodeTarget) {
        return this.edges.find(edge => edge.source === nodeSource.id && edge.target === nodeTarget.id && (edge.type === "ExecutionEdge" || edge.data.type.startsWith("execution-")));
    }

    async nextNodeEdge (node) {
        const nextNode = await this.nextNode(node);
        if(!nextNode) return false;

        const outputEdge = this.edges.find(edge => edge.source === node.id && edge.target === nextNode.id && edge.type === "ExecutionEdge");
        return outputEdge;
    }

    async _executeFlowEvent (node, eventName, eventValues = {}) {
        if(!node) return await this.handleError("Node not found", `Node ${id} not found`);

        
        const _executeNode = async (node, initialValues = false) => {
            console.log("Executing node".gray, node.id, "with initial values".gray, initialValues);
            if(!initialValues) {
                const response = await this.executeNode(node.id, initialValues);
                if(!response) return false;
            }
            const nextNode = await this.nextNode(node, eventName);
            eventName = false;
            if(!nextNode) {
                return await this.handleError("No next node", `No next node found for node ${node.name}`, {
                    nodeId: node.id,
                });
            }
            // if next node is final, don't execute it
            if(nextNode.data?.final) {
                await this.handleLog("Next node is final, ending now...".green.italic.underline, nextNode.name);
                return this.context;
            }

            // executeedge

            const nextNodeEdge = this.getConnectingFlowEdge(node, nextNode);
            if(!nextNodeEdge) return await this.handleError("No next node edge found", `No next node edge found for node ${node.name}`);

            // await this.handleEdgeExecute(nextNodeEdge.id, {});
            return await _executeNode(nextNode);
        }

        const response = await _executeNode(node, eventValues);

        return response;
    }

    async executeFlowEvent (eventName, eventValues) {
        const eventNode = this.nodes.find(node => node.name === eventName);
        if(!eventNode) return await this.handleError("Event node not found", `Event node ${eventName} not found`);

        await this.executeNode(eventNode.id, eventValues);
        const response = await this._executeFlowEvent(eventNode, eventName, eventValues);
        if(response) await this.handleFinish();
        return response;
    }
}