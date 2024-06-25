export const metadata = {
    "description": "Constructs an array ",
    "in": {
        "args": {
            "type": "array<argument>",
            "description": "Arguments to construct the array<argument> from",
            "required": true,
            "expandable": true
        }
    },
    "out": {
        "type": "array",
        "description": "Array constructed from arguments",
    }
}

import Call from "@/services/flow/node/services/Call"

export default function Arguments_construct ({ args }) {
    return Call("Array_construct", {
        type: "argument",
        values: args
    });
}