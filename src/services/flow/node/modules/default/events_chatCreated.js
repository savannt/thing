export const metadata = {
    "description": "Chat created event",
    "in": {
        "chatId": {
            "type": "string",
            "description": "Chat ID",
            "required": true,
            "injected": true
        }
    },
    "out": {
        "chatId": {
            "type": "string",
            "description": "Chat ID"
        }
    }
}

export default function events_chatCreated ({ chatId }) {
    return {
        chatId
    };
}