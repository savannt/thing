export default {
    "Arguments/construct": {
        "name": "Arguments/construct",
        "type": "function",
        "description": "Constructs an array ",
        "path": "default/arguments_construct",
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
            "description": "Array constructed from arguments"
        }
    },
    "Arguments/forEach": {
        "name": "Arguments/forEach",
        "type": "function",
        "description": "Iterates over arguments",
        "path": "default/arguments_forEach",
        "in": {
            "args": {
                "type": "array<argument>",
                "description": "Arguments to iterate over",
                "required": true
            }
        },
        "out": {
            "type": "branch",
            "description": "Output for each argument"
        }
    },
    "Array/construct": {
        "name": "Array/construct",
        "type": "function",
        "description": "Constructs an array ",
        "path": "default/array_construct",
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
                "default": "string"
            }
        },
        "out": {
            "type": "array<T>",
            "description": "Array constructed from arguments of type T"
        }
    },
    "Array/forEach": {
        "name": "Array/forEach",
        "type": "function",
        "description": "Iterates over an array",
        "path": "default/array_forEach",
        "in": {
            "array": {
                "type": "array",
                "description": "Array to iterate over",
                "required": true
            }
        },
        "out": {
            "type": "branch",
            "description": "Output for each element in the array"
        }
    },
    "Events/chatCreated": {
        "name": "Events/chatCreated",
        "type": "event",
        "description": "Chat created event",
        "path": "default/events_chatCreated",
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
    },
    "Events/userMessage": {
        "name": "Events/userMessage",
        "type": "event",
        "description": "User message event",
        "path": "default/events_userMessage",
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
    },
    "Add": {
        "name": "Add",
        "type": "operation",
        "description": "Adds two numbers",
        "path": "default/math_add",
        "in": {
            "a": {
                "type": "number",
                "description": "First number",
                "required": true
            },
            "b": {
                "type": "number",
                "description": "Second number",
                "required": true
            }
        },
        "out": {
            "type": "number",
            "description": "Sum of a and b"
        }
    }
}