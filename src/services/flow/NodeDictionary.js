export default {
	"Constant/String": {
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
		}
	},
	"Constant/Number": {
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
		}
	},
	"Constant/LongString": {
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
		}
	},
	"Chat/SaveMessage": {
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
			}
		}
	},
	"Chat/SaveMessageStream": {
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

	"Events/OnUserMessage": {
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
		}
	},
	"Events/OnChatCreated": {
		type: "EventNode",
		data: {
			displayName: "On Chat Created",

			out: {
				chatId: {
					type: "string<ChatID>",
					description: "Chat ID"
				},
			}
		}
	},
	"Events/OnNotification": {
		type: "EventNode",
		data: {
			displayName: "On Notification",
			description: "Triggered when a message is recevied, but no interface to display it",

			out: {
				message: {
					type: "message",
					description: "Message",
					required: false
				},
				chatId: {
					type: "string<ChatID>",
					description: "Chat ID",
				}
			}
		}
	},
	"Events/OnUserAuthenticate": {
		type: "EventNode",
		data: {
			displayName: "On User Authenticate",
			description: "Triggered when a user visits your thing and is unauthenticated",

			out: {
				user: {
					type: "user",
					description: "User ID"
				}
			}
		}
	},

	"User/setAuthenticated": {
		type: "FunctionNode",
		data: {
			displayName: "Set Authenticated",

			in: {
				user: {
					type: "user",
					description: "User ID"
				},
				authenticated: {
					type: "boolean",
					description: "Authenticated"
				}
			}
		}
	},
	"User/logout": {
		type: "FunctionNode",
		data: {
			displayName: "Logout",

			in: {
				user: {
					type: "user",
					description: "User ID"
				}
			}
		}
	},
	"User/redirectToLogin": {
		type: "FunctionNode",
		data: {
			displayName: "Redirect to Login",

			in: {
				user: {
					type: "user",
					description: "User ID"
				}
			}
		}
	},
	"User/redirectToRegister": {
		type: "FunctionNode",
		data: {
			displayName: "Redirect to Register",

			in: {
				user: {
					type: "user",
					description: "User ID"
				}
			}
		}
	},

	"Flow/If": {
		type: "FunctionNode",
		data: {
			displayName: "If",

			in: {
				condition: {
					type: "boolean",
					description: "Condition"
				},
			},

			out: {
				then: {
					type: "group",
					flow: true,
				},
				else: {
					type: "group",
					flow: true,
				}
			}
		}
	},
	"Flow/While": {
		type: "FunctionNode",
		data: {
			displayName: "While",

			in: {
				condition: {
					type: "boolean",
					description: "Condition"
				},
			},

			out: {
				loop: {
					type: "group",
					flow: true,
				},
			}
		}
	},
	"Flow/For": {
		type: "FunctionNode",
		data: {
			displayName: "For",

			in: {
				start: {
					type: "number",
					description: "Start value"
				},

				end: {
					type: "number",
					description: "End value"
				},

				step: {
					type: "number",
					description: "Step value",
					required: false
				}
			},
			out: {
				loop: {
					type: "group",
					flow: true,

					out: {
						index: {
							type: "number"
						}
					}
				},
			}
		}
	},


	"Array/ForEach": {
		type: "FunctionNode",
		data: {
			displayName: "For Each",
			
			in: {
				array: {
					type: "array",
					description: "Array"
				},
			},
			out: {
				loop: {
					type: "group",
					flow: true,

					out: {
						item: {
							type: "any"
						},
						index: {
							type: "number"
						}
					}
				},
			}
		},
	},

	"Array/Combine": {
		type: "LogicNode",
		data: {
			displayName: "Combine",

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
		}
	},
	"Array/Push": {
		type: "FunctionNode",
		data: {
			displayName: "Push",

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
			}
		}
	},
	"Array/Splice": {
		type: "FunctionNode",
		data: {
			displayName: "Splice",

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
		}
	},
	"Array/Length": {
		type: "LogicNode",
		data: {
			displayName: "Length",

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
		}
	},
	"Array/Filter": {
		type: "FunctionNode",
		data: {
			displayName: "Filter",

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
		}
	},
	"Array/Map": {
		type: "FunctionNode",
		data: {
			displayName: "Map",

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
		}
	},
	"Math/Add": {
		type: "LogicNode",
		data: {
			displayName: "Add",

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
		}
	},
	"Math/Subtract": {
		type: "LogicNode",
		data: {
			displayName: "Subtract",

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
		}
	},
	"Math/Multiply": {
		type: "LogicNode",
		data: {
			displayName: "Multiply",

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
		}
	},
	"Math/Divide": {
		type: "LogicNode",
		data: {
			displayName: "Divide",
			
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
		}
	},
	"JSON/Parse": {
		type: "FunctionNode",
		data: {
			displayName: "Parse",

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
		}
	},
	"JSON/Stringify": {
		type: "FunctionNode",
		data: {
			displayName: "Stringify",

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
			}
		}
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
	"Run/OnMessageEnded": {
		type: "FunctionNode",
		data: {
			displayName: "On Message Ended",

			in: {
				run: {
					type: "run",
				}
			},

			out: {
				onMessageEndedEvent: {
					type: "group",
					flow: true,

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
	},
	"ChromeExtension/IsAvailable": {
		type: "FunctionNode",
		data: {
			displayName: "Is Available",
			
			out: {
				isAvailable: {
					type: "boolean",
					description: "Is Chrome Extension available"
				}
			}
		}
	},
	"ChromeExtension/PromptInstall": {
		type: "FunctionNode",
		data: {
			displayName: "Prompt Install",
			description: "Prompt the user to install the chrome extension"
		}
	},

	
}