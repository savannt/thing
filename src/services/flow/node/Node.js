import { parse as parseNodeId } from "@/services/nodeId";

const NodeTypes = {
    FUNCTION: "function",
    EVENT: "event",
    OPERATION: "operation",
}

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

        if(this.name.toLowerCase().startsWith("events/"))   type = NodeTypes.EVENT;
        else if(this.metadata.operation) type = NodeTypes.OPERATION;

        
        this.description = description;
        this.path = path;
        this.type = type;
        this.inputs = inputs;
        this.outputs = outputs;
    }

    asJSON () {
        return {
            name: this.name,
            type: this.type,
            description: this.description,
            path: this.path,
            in: this.inputs,
            out: this.outputs
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