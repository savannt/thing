export const metadata = {
    "description": "Iterates over an array",
    "in": {
        "array": {
            "type": "array",
            "description": "Array to iterate over",
            "required": true
        }
    },
    "out": {
        "type": "branch",
        "description": "Output for each element in the array",
    },
}

import Event from "@/services/flow/node/services/Event"

export default function Array_forEach ({ array }) {
    const event = new Event("Array_forEach");

    array.forEach(async (element, index) => {
        await event.handle({ element, index });
    });

    return event;
}