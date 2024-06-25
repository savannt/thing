export const metadata = {
    "description": "Iterates over arguments",
    "in": {
        "args": {
            "type": "array<argument>",
            "description": "Arguments to iterate over",
            "required": true
        }
    },
    "out": {
        "type": "branch",
        "description": "Output for each argument",
    }
}

import Call from "@/services/flow/node/services/Call"

export default function Arguments_forEach ({ args }) {
    return Call("Array_forEach", { array: args });
}