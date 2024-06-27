export const metadata = {
    "description": "Constructs an argument",
    "in": {
        "name": {
            "type": "string",
            "description": "Argument name",
            "required": true,
        },
        "type": {
            "type": "type",
            "description": "Argument type",
            "required": true,
        },
        "required": {
            "type": "boolean",
            "description": "Argument required",
            "required": false,
            "default": false,
        },
        "description": {
            "type": "string",
            "description": "Argument description",
            "required": false,
            "default": "",
        },
        "value": {
            "type": "any",
            "description": "Argument value",
            "required": false,
            "default": null,
        }
    },
    "out": {
        "type": "argument",
        "description": "Array constructed from arguments",
    },
    "operation": true,
    "icon": "join",
}

import Argument from "@/services/flow/node/services/types/Argument"

export default function Argument_construct (props) {
    return Argument(props);
}