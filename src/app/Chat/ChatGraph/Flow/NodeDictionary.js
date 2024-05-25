export default {
    "StringConstant": {
        type: "ConstantNode",
        data: {
            displayName: "String Constant",
            category: "Constant",

            out: {
                value: {
                    type: "string",
                    description: "String value",
                    constant: true
                }
            }
        },
        handler: function String ({ value }) {
            return { value }
        }
    },
    "NumberConstant": {
        type: "ConstantNode",
        data: {
            displayName: "Number Constant",
            category: "Constant",

            out: {
                value: {
                    type: "number",
                    description: "Number value",
                    constant: true
                }
            }
        },
        handler: function Number ({ value }) {
            return { value }
        }
    },
    "TextareaStringConstant": {
        type: "ConstantNode",
        data: {
            displayName: "Textarea String Constant",
            category: "Constant",

            out: {
                value: {
                    type: "string",
                    description: "String value",
                    constant: true
                },
            }
        },
        handler: function TextareaString ({ value }) {
            return { value }
        }
    },
    "SaveMessage": {
        type: "FunctionNode",
        data: {
            displayName: "Save Message",
            category: "Function",

            label: "Save Message",
            details: "function",

            in: {
                message: {
                    type: "message",
                    description: "Message to save"
                }
            },
            final: true
        },
        handler: function SaveMessage ({ message }) {
            return { message };
        }
    },
    "OnUserMessage": {
        type: "EventNode",
        data: {
            displayName: "On User Message",
            category: "Event",

            label: "onUserMessage",
            details: "event",

            out: {
                message: {
                    type: "message",
                    description: "User message"
                },
            }
        },
        handler: function OnUserMessage ({ message, attachments }) {
            return { message, attachments };
        }
    },
    "OnChatCreated": {
        type: "EventNode",
        data: {
            displayName: "On Chat Created",
            category: "Event",

            label: "onChatCreated",
            details: "event",

            out: {
                chatId: {
                    type: "string<ChatID>",
                    description: "Chat ID"
                },
            }
        }
    },
    "Array/Combine": {
        type: "LogicNode",
        data: {
            displayName: "Combine",
            category: "Array",

            label: "Combine",
            details: "array/combine",

            in: {
                arrayA: {
                    type: "array",
                    description: "First array"
                },
                arrayB: {
                    type: "array",
                    description: "Second array"
                }
            },
            out: {
                combined: {
                    type: "array",
                    description: "Combined array"
                }
            }
        },
        handler: function ArrayCombine ({ arrayA, arrayB }) {
            return { combined: arrayA.concat(arrayB) };
        }
    },
    "Array/Push": {
        type: "FunctionNode",
        data: {
            displayName: "Push",
            category: "Array",

            label: "Push",
            details: "array/push",

            in: {
                array: {
                    type: "array",
                    description: "Array to push to"
                },
                value: {
                    type: "any",
                    description: "Value to push"
                }
            },
            out: {
                array: {
                    type: "array",
                    description: "Array after push"
                }
            },
        },
        handler: function ArrayPush ({ array, value }) {
            array.push(value);
            return { array };
        }
    },
    "Array/Splice": {
        type: "FunctionNode",
        data: {
            displayName: "Splice",
            category: "Array",

            label: "Splice",
            details: "array/splice",

            in: {
                array: {
                    type: "array",
                    description: "Array to splice"
                },
                start: {
                    type: "number",
                    description: "Index to start at"
                },
                deleteCount: {
                    type: "number",
                    description: "Number of items to delete"
                },
                items: {
                    type: "array",
                    description: "Items to insert",
                    required: false
                }
            },
            out: {
                array: {
                    type: "array",
                    description: "Array after splice"
                }
            }
        },
        handler: function ArraySplice ({ array, start, deleteCount, items }) {
            array.splice(start, deleteCount, ...items);
            return { array };
        }
    },
    "Array/Length": {
        type: "LogicNode",
        data: {
            displayName: "Length",
            category: "Array",
            label: "Length",
            details: "array/length",
            in: {
                array: {
                    type: "array",
                    description: "Array to get length of"
                }
            },
            out: {
                length: {
                    type: "number",
                    description: "Length of array"
                }
            }
        },
        handler: function ArrayLength ({ array }) {
            return { length: array.length };
        }
    },
    "Array/Filter": {
        type: "FunctionNode",
        data: {
            displayName: "Filter",
            category: "Array",
            label: "Filter",
            details: "array/filter",
            in: {
                array: {
                    type: "array",
                    description: "Array to filter"
                },
                condition: {
                    type: "function",
                    description: "Condition to filter by"
                }
            },
            out: {
                array: {
                    type: "array",
                    description: "Filtered array"
                }
            }
        },
        handler: function ArrayFilter ({ array, condition }) {
            return { array: array.filter(condition) };
        }
    },
    "Array/Map": {
        type: "FunctionNode",
        data: {
            displayName: "Map",
            category: "Array",
            label: "Map",
            details: "array/map",

            in: {
                array: {
                    type: "array",
                    description: "Array to map"
                },
                transformation: {
                    type: "function",
                    description: "Transformation function"
                }
            },
            out: {
                array: {
                    type: "array",
                    description: "Transformed array"
                }
            }
        },
        handler: function ArrayMap ({ array, transformation }) {
            return { array: array.map(transformation) };
        }
    },
    "Math/Add": {
        type: "LogicNode",
        data: {
            displayName: "Add",
            category: "Math",
            label: "Add",
            details: "math/add",
            in: {
                a: {
                    type: "number",
                    description: "First number"
                },
                b: {
                    type: "number",
                    description: "Second number"
                }
            },
            out: {
                result: {
                    type: "number",
                    description: "Sum of numbers"
                }
            }
        },
        handler: function MathAdd ({ a, b }) {
            return { result: a + b };
        }
    },
    "Math/Subtract": {
        type: "LogicNode",
        data: {
            displayName: "Subtract",
            category: "Math",
            label: "Subtract",
            details: "math/subtract",
            in: {
                a: {
                    type: "number",
                    description: "First number"
                },
                b: {
                    type: "number",
                    description: "Second number"
                }
            },
            out: {
                result: {
                    type: "number",
                    description: "Difference of numbers"
                }
            }
        },
        handler: function MathSubtract ({ a, b }) {
            return { result: a - b };
        }
    },
    "Math/Multiply": {
        type: "LogicNode",
        data: {
            displayName: "Multiply",
            category: "Math",
            label: "Multiply",
            details: "math/multiply",
            in: {
                a: {
                    type: "number",
                    description: "First number"
                },
                b: {
                    type: "number",
                    description: "Second number"
                }
            },
            out: {
                result: {
                    type: "number",
                    description: "Product of numbers"
                }
            }
        },
        handler: function MathMultiply ({ a, b }) {
            return { result: a * b };
        }
    },
    "Math/Divide": {
        type: "LogicNode",
        data: {
            displayName: "Divide",
            category: "Math",
            label: "Divide",
            details: "math/divide",
            in: {
                a: {
                    type: "number",
                    description: "Dividend"
                },
                b: {
                    type: "number",
                    description: "Divisor"
                }
            },
            out: {
                result: {
                    type: "number",
                    description: "Quotient of numbers"
                }
            }
        },
        handler: function MathDivide ({ a, b }) {
            return { result: a / b };
        }
    },
    "JSON/Parse": {
        type: "FunctionNode",
        data: {
            displayName: "Parse",
            category: "JSON",
            label: "Parse",
            details: "json/parse",
            in: {
                jsonString: {
                    type: "string",
                    description: "JSON string to parse"
                }
            },
            out: {
                object: {
                    type: "object",
                    description: "Parsed JSON object"
                }
            }
        },
        handler: function JSONParse ({ jsonString }) {
            return { object: JSON.parse(jsonString) };
        }
    },
    "JSON/Stringify": {
        type: "FunctionNode",
        data: {
            displayName: "Stringify",
            category: "JSON",
            label: "Stringify",
            details: "json/stringify",
            in: {
                object: {
                    type: "object",
                    description: "Object to stringify"
                }
            },
            out: {
                jsonString: {
                    type: "string",
                    description: "Stringified JSON"
                }
            }
        },
        handler: function JSONStringify ({ object }) {
            return { jsonString: JSON.stringify(object) };
        }
    },
}