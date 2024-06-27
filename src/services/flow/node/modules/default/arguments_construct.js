export const metadata = {
    "description": "Constructs an array of arguments",
    "in": {
        "args": {
            "type": "array<argument>",
            "description": "Arguments to construct the array<argument> from",
            "required": true,
            "expandable": true
        }
    },
    "out": {
        "type": "array<argument>",
        "description": "Array constructed from arguments",
    },
    "operation": true,
    "icon": "join",
}

import Call from "@/services/flow/node/services/Call"

export default function Arguments_construct ({ args }) {
    return Call("Array_construct", {
        type: "argument",
        values: args
    });
}