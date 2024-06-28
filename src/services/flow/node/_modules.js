export default {
    "Argument/construct": {
        "name": "Argument/construct",
        "type": "operation",
        "description": "Constructs an argument",
        "path": "default/argument_construct",
        "in": {
            "name": {
                "type": "string",
                "description": "Argument name",
                "required": true
            },
            "type": {
                "type": "type",
                "description": "Argument type",
                "required": true
            },
            "required": {
                "type": "boolean",
                "description": "Argument required",
                "required": false,
                "default": false
            },
            "description": {
                "type": "string",
                "description": "Argument description",
                "required": false,
                "default": ""
            },
            "value": {
                "type": "any",
                "description": "Argument value",
                "required": false,
                "default": null
            }
        },
        "out": {
            "out": {
                "type": "argument",
                "description": "Array constructed from arguments"
            }
        },
        "resolve": false,
        "icon": "join"
    },
    "Arguments/construct": {
        "name": "Arguments/construct",
        "type": "operation",
        "description": "Constructs an array of arguments",
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
            "out": {
                "type": "array<argument>",
                "description": "Array constructed from arguments"
            }
        },
        "resolve": false,
        "icon": "join"
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
            "out": {
                "type": "branch",
                "description": "Output for each argument"
            }
        },
        "resolve": false,
        "icon": "triangle"
    },
    "Array/construct": {
        "name": "Array/construct",
        "type": "operation",
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
            "out": {
                "type": "array<T>",
                "description": "Array constructed from arguments of type T"
            }
        },
        "resolve": false,
        "icon": "triangle"
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
            "out": {
                "type": "branch",
                "description": "Output for each element in the array"
            }
        },
        "resolve": false,
        "icon": "triangle"
    },
    "Constant/string": {
        "name": "Constant/string",
        "type": "operation",
        "description": "A string constant",
        "path": "default/constant_string",
        "in": {},
        "out": {
            "out": {
                "type": "string",
                "description": "The constant string value",
                "constant": true
            }
        },
        "resolve": false,
        "icon": "triangle"
    },
    "Constant/type": {
        "name": "Constant/type",
        "type": "operation",
        "description": "A type constant",
        "path": "default/constant_type",
        "in": {},
        "out": {
            "out": {
                "type": "type",
                "description": "The constant type value",
                "constant": true,
                "values": [
                    "string",
                    "number",
                    "boolean",
                    "array"
                ]
            }
        },
        "resolve": false,
        "icon": "triangle"
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
        },
        "resolve": false,
        "icon": "triangle"
    },
    "Events/function": {
        "name": "Events/function",
        "type": "event",
        "path": "default/events_function",
        "in": {
            "name": {
                "type": "string",
                "description": "Function name",
                "required": true
            },
            "arguments": {
                "type": "array<argument>",
                "description": "Function arguments",
                "required": true
            }
        },
        "out": {
            "thing": {
                "type": "thing",
                "description": "Thing runtime",
                "required": false
            },
            "chatId": {
                "type": "chatId",
                "description": "Chat ID",
                "required": false
            }
        },
        "resolve": {
            "arguments": {
                "type": "in"
            }
        },
        "icon": "process"
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
        },
        "resolve": false,
        "icon": "triangle"
    },
    "Flow/end": {
        "name": "Flow/end",
        "type": "end",
        "description": "Ends a flow",
        "path": "default/flow_end",
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
        "out": {},
        "resolve": false,
        "icon": "end"
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
            "out": {
                "type": "number",
                "description": "Sum of a and b"
            }
        },
        "resolve": false,
        "icon": "triangle"
    }
}