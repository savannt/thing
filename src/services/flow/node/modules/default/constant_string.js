export const metadata = {
    "description": "A string constant",
    "out": {
        "type": "string",
        "description": "The constant string value",
        "constant": true
    },
    "operation": true
}

import Argument from "@/services/flow/node/services/types/Argument"

export default function Constant_string ({ value }) {
    return value;
}