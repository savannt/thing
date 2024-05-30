export const DEFAULT_INPUTS_REQUIRED = true;
export const DEFAULT_OUTPUTS_REQUIRED = true;

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

    async onEdgeOn (callback) {
        this._onEdgeOn = callback;
    }

    async onEdgeOff (callback) {
        this._onEdgeOff = callback;
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
        console.log(...args);
    }

    async handleExecute (nodeId, defaultOutputValues = {}) {
        if(this._onExecute) await this._onExecute(nodeId, defaultOutputValues);
        console.log("Starting execution", nodeId, "with default output values", defaultOutputValues);
    }

    async handleExecuteResponse (nodeId, outputValues) {
        if(this._onExecuteResponse) await this._onExecuteResponse(nodeId, outputValues);
        console.log("Executed", nodeId, "with output values", outputValues);
    }

    async handleEdgeExecute (edgeId, value) {
        if(this._onEdgeExecute) await this._onEdgeExecute(edgeId, value);
        console.log("Edge executed", edgeId, "with value", value);
    }

    async handleEdgeOn (edgeId) {
        if(this._onEdgeOn) await this._onEdgeOn(edgeId);
        console.log("Edge on", edgeId);
    }

    async handleEdgeOff (edgeId) {
        if(this._onEdgeOff) await this._onEdgeOff(edgeId);
        console.log("Edge off", edgeId);
    }

    async handleFinish () {
        if(this._onFinish) await this._onFinish();
        console.log("Flow finished");
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

    async isNodeValid (node) {
        if(!node) return await this.handleError("Node not found", `Node ${id} not found`);
        
        const nodeType = node.type;

        const inputs = node.data?.in || {};
        const outputs = node.data?.out || {};

        const inputEdges = this.edges.filter(edge => edge.target === node.id && edge.type === "DataEdge");
        const inputExecutionEdges = this.edges.filter(edge => edge.target === node.id && edge.type === "ExecutionEdge");
        const outputEdges = this.edges.filter(edge => edge.source === node.id && edge.type === "DataEdge");
        const outputExecutionEdges = this.edges.filter(edge => edge.source === node.id && edge.type === "ExecutionEdge");

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

        for(const key in outputs) {
            const type = outputs[key].type;
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

    async executeNode (id, defaultOutputValues = {}) {
        const node = this.nodes.find(node => node.id === id);
        if(!node) return await this.handleError("Node not found", `Node ${id} not found`);

        // ping execution event to client
        await this.handleExecute(id, defaultOutputValues);

        // verify node is valid
        const isValidNode = await this.isNodeValid(node);
        if(!isValidNode) return false;




        const inputs = node.data?.in || {};
        const outputs = node.data?.out || {};

        const inputEdges = this.edges.filter(edge => edge.target === node.id && edge.type === "DataEdge");
        const outputEdges = this.edges.filter(edge => edge.source === node.id && edge.type === "DataEdge");





        // for each input edge- check if we have a saved value for it-  otherwise we need to execute the source node first before proceeding
        // (save edge values to this.context[edgeId])
        
        let inputValues = {}; 
        for(const edge of inputEdges) {
            const edgeId = edge.id;
            if(!this.context[edgeId]) {
                let idSplits = edge.id.split(":");
                const backwardsParamName = idSplits[idSplits.length - 1];
                this.handleLog("Must backwards generate input", backwardsParamName, { edgeId, nodeId: node.id });

                // get the source node (go backwards on this input)
                const sourceNode = this.nodes.find(node => node.id === edge.source);
                if(!sourceNode) return await this.handleError("No backwards node for input", backwardsParamName, { edgeId, nodeId: node.id });

                // execute the source node
                await this.executeNode(sourceNode.id);
                // now it's value should be in contexts
                if(!this.context[edgeId]) return await this.handleError("Node failed to generate input", backwardsParamName, { edgeId, nodeId: node.id });
            }
            
            // console.log(edge);
            // TOOD: FINISH HERE, set inputValues[????] = this.context[edgeId]
         
            

            let edgeSplits = edge.id.split(":");
            const edgeParamName = edgeSplits[edgeSplits.length - 1];
                        
            inputValues[edgeParamName] = this.context[edgeId];
        }

        // check if we are missing any required input values
        for(const key in inputs) {
            const required = typeof inputs[key].required === "undefined" ? DEFAULT_INPUTS_REQUIRED : inputs[key].required;
            if(!inputValues[key] && required) return await this.handleError("Missing required input", `${key}`, { nodeId: node.id });
        }


        if(defaultOutputValues) inputValues = { ...inputValues, ...defaultOutputValues };

        this.handleLog("Executing node", node.id, "with input values", inputValues);

        // execute the node's handler
        const handler = NodeHandlerDictionary[node.name];
        if(!handler) return await this.handleError("Handler not found", `Handler for node ${node.name} not found`);
        const outputValues = await handler(inputValues);

        // check output values against outputs keyName: { type, required, description }
        for(const key in outputs) {
            const type = outputs[key].type;
            const required = typeof outputs[key].required === "undefined" ? DEFAULT_OUTPUTS_REQUIRED : outputs[key].required;

            if(!outputValues[key] && required) await this.handleLog("Handler", handler.toString(), "failed to generate output", key, outputValues);
            if(!outputValues[key] && required) return await this.handleError("Handler failed to generate output", `${key}`, { nodeId: node.id });
        }

        // save output values to this.context[outputEdgeId]
        for(const key in outputs) {
            // console.log("key", key);

            
            const outputEdge = outputEdges.find(edge => {
                return edge.data.type.split(":")[1] === key;
            });
            await this.handleEdgeExecute(outputEdge.id, outputValues[key]);
            if(outputEdge) {
                this.context[outputEdge.id] = outputValues[key];
            }
            // console.log("outputEdge", outputEdge);
            // this.context[outputEdge.id] = outputValues[key];
        }


        await this.handleExecuteResponse(node.id, outputValues);


        // console.log("context", this.context);

        return true;
    }

    async nextNode (node) {
        const outputExecutionEdges = this.edges.filter(edge => edge.source === node.id && edge.type === "ExecutionEdge");
        if(outputExecutionEdges.length === 0) return false;

        const nextNode = this.nodes.find(node => node.id === outputExecutionEdges[0].target);
        return nextNode;
    }

    async nextNodeEdge (node) {
        const nextNode = await this.nextNode(node);
        if(!nextNode) return false;

        const outputEdge = this.edges.find(edge => edge.source === node.id && edge.target === nextNode.id && edge.type === "ExecutionEdge");
        return outputEdge;
    }


    async executeFlowEvent (eventName, eventValues) {
        const eventNode = this.nodes.find(node => node.name === eventName);
        if(!eventNode) return await this.handleError("Event node not found", `Event node ${eventName} not found`);

        const _executeNode = async (node, initialValues) => {
            const response = await this.executeNode(node.id, initialValues);
            if(!response) return false;
            const nextNode = await this.nextNode(node);
            const nextNodeEdge = await this.nextNodeEdge(node);
            if(!nextNode) return this.context;
            if(!nextNodeEdge) return this.handleError("No next node edge", `No next node edge for node ${node.id}`);
            
            await this.handleEdgeOn(nextNodeEdge.id);

            return await _executeNode(nextNode);
        }

        const response = await _executeNode(eventNode, eventValues);

        if(response) await this.handleFinish();

        return response
    }
}