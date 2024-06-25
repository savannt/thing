export const metadata = {
    "description": "",
    "in": {
        "name": {
            "type": "string",
            "description": "Function name",
            "required": true,
        },
        "arguments": {
            "type": "array<argument>",
            "description": "Function arguments",
            "required": true,
        }
    },
    "out": {
        "thing": {
            "type": "thing",
            "description": "Thing runtime",
            "required": false,
        },
        "chatId": {}
    }
}

export default function events_function ({ chatId }) {
    return {
        chatId
    };
}