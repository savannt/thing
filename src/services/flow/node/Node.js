import { parse as parseNodeId } from "@/services/nodeId";

export const DEFAULT_OUTPUT_NAME = "out";

import NodeTypes from "@/services/flow/node/NodeTypes"

class Node {

    constructor (fn, metadata) {
        this.init(fn, metadata);
    }
    
    init (fn, metadata) {
        this.fn = fn;
        this.metadata = metadata;


        let name        = this.metadata.name        || this.fn.name;
        if(!name) throw new Error("Name is required");
        this.name = parseNodeId(name);
        let description = this.metadata.description || this.fn.description;
        let path        = this.metadata.path        || "";
        let inputs      = this.metadata.in          || {};
        let outputs     = this.metadata.out         || {};
        let type        = this.metadata.type        || NodeTypes.FUNCTION;
        let icon        = this.metadata.icon        || "triangle";

        if(this.name.toLowerCase().startsWith("events/"))  type = NodeTypes.EVENT;
        if(this.name.toLowerCase().startsWith("flow/end")) type = NodeTypes.END;
        else if(this.metadata.operation)                   type = NodeTypes.OPERATION;

        // if has outputs.type && typeof outputs.type === "string"
        if(outputs.type && typeof outputs.type === "string") outputs = { [DEFAULT_OUTPUT_NAME]: outputs };
        this.description = description;
        this.path = path;
        this.type = type;
        this.inputs = inputs;
        this.outputs = outputs;
        this.icon = icon;
    }

    asJSON () {
        return {
            name: this.name,
            type: this.type,
            description: this.description,
            path: this.path,
            in: this.inputs,
            out: this.outputs,
            icon: this.icon
        }
    }

    static from (fn, metadata) {
        if(!fn) throw new Error("Function is required");
        if(typeof fn !== "function") throw new Error("Function must be a function");
        if(!metadata) throw new Error("Metadata is required");

        return new Node(fn, metadata);
    }
}
export default Node;