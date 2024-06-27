export const metadata = {
    "description": "Constructs an array ",
    "in": {
        "values": {
            "type": "array",
            "description": "Values to construct the array from",
            "required": true,
            "expandable": true
        },
        "type": {
            "type": "type",
            "description": "Type of the array",
            "required": false,
            "default": "string",
        }
    },
    "out": {
        "type": "array<T>",
        "description": "Array constructed from arguments of type T",
    },
    "operation": true
}

import Array from "@/services/flow/node/services/types/Array"

export default function Array_construct ({ values, type = "string" }) {
    return new Array(values || [], type);
}