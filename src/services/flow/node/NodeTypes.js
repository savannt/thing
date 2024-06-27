import EventNode from "@/app/Chat/ChatGraph/Flow/NodeTypes/EventNode"
import FunctionNode from "@/app/Chat/ChatGraph/Flow/NodeTypes/FunctionNode"
import OperationNode from "@/app/Chat/ChatGraph/Flow/NodeTypes/OperationNode"
import EndNode from "@/app/Chat/ChatGraph/Flow/NodeTypes/EndNode"

const NodeTypes = {
    FUNCTION: "function",
    EVENT: "event",
    OPERATION: "operation",
    END: "end",
}
export default NodeTypes;

export const RawNodeTypes = {
	EventNode: EventNode,
	FunctionNode: FunctionNode,
	OperationNode: OperationNode,
	EndNode: EndNode
};

export function getRawNodeType (nodeType) {
    if(!nodeType) return false;

    switch(nodeType) {
        case NodeTypes.EVENT: return "EventNode";
        case NodeTypes.FUNCTION: return "FunctionNode";
        case NodeTypes.OPERATION: return "OperationNode";
        case NodeTypes.END: return "EndNode";
    }
    
    return false;
}

export function parseSecondaryType (fullType) {
    // if fullType includes <some text here> return that text,
    // for example "array<type here>" would return "type here"
    const match = fullType.match(/<(.*)>/);
    if(match) return match[1];
    return false;
}