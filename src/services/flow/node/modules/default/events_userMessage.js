export const metadata = {
    "description": "User message event",
    "in": {
        "message": {
            "type": "string",
            "description": "Message to send",
            "required": true,
            "injected": true
        },
        "chatId": {
            "type": "string",
            "description": "Chat ID",
            "required": true,
            "injected": true
        }
    },
    "out": {
        "message": {
            "type": "string",
            "description": "Message to send"
        },
        "chatId": {
            "type": "string",
            "description": "Chat ID"
        }
    }
}

export default function events_userMessage ({ message, chatId }) {
    return {
        message,
        chatId
    };
}