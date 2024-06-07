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

			in: {
				message: {
					type: "message",
					description: "Message to save"
				},
				chatId: {
					type: "chatId",
					description: "Chat ID to Save Message To",
					required: false,
				}
			},
		},
	},
	"SaveMessageStream": {
		type: "FunctionNode",
		data: {
			displayName: "Save Message Stream",

			in: {
				message: {
					type: "message",
					description: "Message to save"
				},
				messageId: {
					type: "number",
					description: "Message ID",
				},
				chatId: {
					type: "chatId",
					description: "Chat ID to Save Message To",
					required: false,
				}
			}
		}
	},
	"OnUserMessage": {
		type: "EventNode",
		data: {
			displayName: "On User Message",

			out: {
				message: {
					type: "message",
					description: "User message"
				},
				chatId: {
					type: "chatId",
					description: "Chat ID",
					required: false
				},
				files: {
					type: "files",
					description: "Files",
					required: false
				}
			}
		},
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

	"Messages/CreateEmpty": {
		type: "LogicNode",
		data: {
			displayName: "Create Empty Messages",

			out: {
				messages: {
					type: "messages",
					description: "Empty messages array"
				}
			},
		},
	},
	"Messages/Push": {
		type: "LogicNode",
		data: {
			displayName: "Push Message",

			in: {
				messages: {
					type: "messages",
					description: "Messages array"
				},
				message: {
					type: "message",
					description: "Message to push"
				}
			},
			out: {
				messages: {
					type: "messages",
					description: "Messages array after push"
				}
			}
		}
	},
	"Messages/Combine": {
		type: "LogicNode",
		data: {
			displayName: "Combine Messages",

			in: {
				messagesA: {
					type: "messages",
					description: "First messages array"
				},
				messagesB: {
					type: "messages",
					description: "Second messages array"
				}
			},
			out: {
				messages: {
					type: "messages",
					description: "Combined messages array"
				}
			}
		}
	},
	"Message/Construct": {
		type: "LogicNode",
		data: {
			displayName: "Construct Message",

			in: {
				text: {
					type: "string",
					description: "Message text"
				},
				author: {
					type: "author",
					description: "Message author"
				}
			},
			out: {
				message: {
					type: "message",
					description: "Constructed message"
				}
			}
		}
	},
	"Message/GetText": {
		type: "LogicNode",
		data: {
			displayName: "Get Message Text",

			in: {
				message: {
					type: "message",
					description: "Message"
				}
			},
			out: {
				text: {
					type: "string",
					description: "Message text"
				}
			}
		}
	},
	"Message/GetAuthor": {
		type: "LogicNode",
		data: {
			displayName: "Get Message Author",

			in: {
				message: {
					type: "message",
					description: "Message"
				}
			},
			out: {
				author: {
					type: "author",
					description: "Message author"
				}
			}
		}
	},
	"Message/GetTimestamp": {
		type: "LogicNode",
		data: {
			displayName: "Get Message Timestamp",

			in: {
				message: {
					type: "message",
					description: "Message"
				}
			},
			out: {
				timestamp: {
					type: "number",
					description: "Message timestamp"
				}
			}
		}
	},
	"Message/SetText": {
		type: "LogicNode",
		data: {
			displayName: "Set Message Text",

			in: {
				message: {
					type: "message",
					description: "Message"
				},
				text: {
					type: "string",
					description: "Text to set"
				}
			},
			out: {
				message: {
					type: "message",
					description: "Message after setting text"
				}
			}
		}
	},
	"Message/SetAuthor": {
		type: "LogicNode",
		data: {
			displayName: "Set Message Author",

			in: {
				message: {
					type: "message",
					description: "Message"
				},
			},
			out: {
				message: {
					type: "message",
					description: "Message after setting author"
				}
			}
		}
	},

	
	"ChatCompletion/Create": {
		type: "FunctionNode",
		data: {
			displayName: "Create ChatCompletion",

			in: {
				messages: {
					type: "messages",
					description: "Messages"
				}
			},
			out: {
				run: {
					type: "run",
					description: "Chat completion"
				}
			}
		}
	},

	"ChatCompletion/CreateWithTools": {
		type: "FunctionNode",
		data: {
			displayName: "Create ChatCompletion With Tools",

			in: {
				messages: {
					type: "messages",
					description: "Messages"
				},
				tools: {
					type: "tools",
					description: "Tools"
				},
			},
			out: {
				run: {
					type: "run",
					description: "Chat completion"
				}
			}
		}
	},

	"Run/OnMessage": {
		type: "FunctionNode",
		data: {
			displayName: "On Message",

			in: {
				run: {
					type: "run",
					description: "Chat completion"
				}
			},

			out: {
				onMessageEvent: {
					type: "group",
					flow: true,
					description: "On message event",

					out: {
						message: {
							type: "message",
							description: "Message"
						},
						messageId: {
							type: "number",
							description: "Message ID",
							required: false
						}
					}
					
				}
			}
		}
	},
	"Run/OnMessageStarted": {
		type: "FunctionNode",
		data: {
			displayName: "On Message Started",

			in: {
				run: {
					type: "run",
					description: "Chat completion"
				}
			},

			out: {
				onMessageStartedEvent: {
					type: "group",
					flow: true,
					description: "On message started event",

					out: {
						messageId: {
							type: "number",
							description: "Message ID"
						}
					}
				}
			}
		}
	},
	"Run/OnMessageStream": {
		type: "FunctionNode",
		data: {
			displayName: "On Message Stream",

			in: {
				run: {
					type: "run",
					description: "Chat completion"
				}
			},

			out: {
				onMessageStreamEvent: {
					type: "group",
					flow: true,
					displayName: "On Message Stream Event",
					description: "On message stream event",

					out: {
						message: {
							type: "message",
							description: "Message, content will be streamed"
						},
						messageId: {
							type: "number",
							description: "Message ID",
							required: false
						}
					}
				}
			}
		}
	},

	"Assistant/Create": {
		type: "FunctionNode",
		data: {
			displayName: "Create",
			category: "Assistant",

			label: "Create",
			details: "assistant/create",

			in: {
				name: {
					type: "string",
					description: "Assistant name"
				},
				instructions: {
					type: "string",
					description: "Assistant instructions"
				},
				tools: {
					type: "tools",
					description: "Assistant tools"
				}
			},
			out: {
				assistant: {
					type: "assistant",
					description: "Created assistant"
				}
			}
		}
	},
	"Assistant/GetFromId": {
		type: "FunctionNode",
		data: {
			displayName: "Get From ID",
			category: "Assistant",

			label: "Get From ID",
			details: "assistant/getFromId",

			in: {
				assistantId: {
					type: "string",
					description: "Assistant ID"
				}
			},
			out: {
				assistant: {
					type: "assistant",
					description: "Retrieved assistant"
				}
			}
		}
	},
	"Assistant/Update": {
		type: "FunctionNode",
		data: {
			displayName: "Update",
			category: "Assistant",

			label: "Update",
			details: "assistant/update",

			in: {
				assistant: {
					type: "assistant",
					description: "Assistant to update"
				},
				data: {
					type: "object",
					description: "Data to update"
				}
			},
			out: {
				assistant: {
					type: "assistant",
					description: "Updated assistant"
				}
			}
		}
	},
	"Assistant/SetTools": {
		type: "FunctionNode",
		data: {
			displayName: "Set Tools",
			category: "Assistant",
			
			label: "Set Tools",
			details: "assistant/setTools",

			in: {
				assistant: {
					type: "assistant",
					description: "Assistant"
				},
				tools: {
					type: "tools",
					description: "Tools"
				}
			},
			out: {
				assistant: {
					type: "assistant",
					description: "Assistant after setting tools"
				}
			}
		}
	},

	"Tools/CreateEmpty": {
		type: "LogicNode",
		data: {
			displayName: "Create Empty",
			category: "Tools",

			label: "Create Empty",
			details: "tools/createEmpty",

			out: {
				tools: {
					type: "tools",
					description: "Empty tools"
				}
			}
		}
	},
	"Tools/Add": {
		type: "FunctionNode",
		data: {
			displayName: "Add",
			category: "Tools",

			label: "Add",
			details: "tools/add",

			in: {
				tools: {
					type: "tools",
					description: "Tools"
				},
				tool: {
					type: "tool",
					description: "Tool to add"
				}
			},
			out: {
				tools: {
					type: "tools",
					description: "Tools after adding tool"
				}
			}
		}
	},

	"Utility/End": {
		type: "EndNode",
		data: {
			displayName: "End",
			
			final: true
		}
	},

	"Utility/PlayNotification": {
		type: "FunctionNode",
		data: {
			displayName: "Play Notification",
			category: "Utility",

			label: "Play Notification",
			details: "utility/playNotification",

			in: {
				title: {
					type: "string",
					description: "Notification title",
					required: false
				},
				content: {
					type: "string",
					description: "Notification message"
				}
			}
		}
	},
	

	
	"Terminal/SetTerminalColor": {
		type: "FunctionNode",
		data: {
			displayName: "Set Terminal Color",
			
			in: {
				color: {
					type: "color"
				}
			}
		}
	},
	"Terminal/SetTerminalHasBorder": {
		type: "FunctionNode",
		data: {
			displayName: "Set Terminal Has Border",

			in: {
				hasBorder: {
					type: "boolean"
				}
			}
		}
	},
	"Terminal/SetTerminalHasGlow": {
		type: "FunctionNode",
		data: {
			displayName: "Set Terminal Has Glow",

			in: {
				hasGlow: {
					type: "boolean"
				}
			}
		}
	}
}