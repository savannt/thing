/*

 Game Plan:
	* Create terminal UI mode



*/

import "../../../../alias-register.js";

process.env.OPENAI_API_KEY = "sk-1234567890abcdef1234567890abcdef";
import { ChatCompletion, Messages, Tools, Tool } from "../OpenAI.js"


const EXAMPLE_ARGUMENTS_OBJECT = {
	arg1: { type: "string", description: "this first argument is a string" },
	arg2: { type: "array", description: "this second argument is an array", items: { type: "string", description: "array of strings" } },
	arg3: {
		type: "object",
		description: "this third argument is an object",
		properties: {
			prop1: { type: "string", description: "string property" },
			prop2: { type: "number", description: "number property" },
			prop3: {
				type: "array",
				description: "array property",
				items: {
					type: "object",
					properties: {
						prop1: { type: "string", description: "string property" },
						prop2: { type: "number", description: "number property" }
					}
				}
			}
		}
	}
};









(async () => {
	let tools = new Tools();


	let aboutMeTool = Tool.createFromJsFn(
		function about_me () {
			return [
				"#1 I am a pirate",
				"#2 I like to sail the seven seas",
				"#3 I have a parrot named Polly",
				"#4 I have a wooden leg",
			]
		}
	)
	tools.add(aboutMeTool);


	let createFunctionTool = Tool.createFromJsFn(
		async function create_function ({ name, arguments: argumentsArray, intent }) {
			if(!name) throw new Error("Name is required");
			if(!argumentsArray) throw new Error("Arguments are required");
			if(!intent) throw new Error("Intent is required");

			// convert argumentsArray to object where it's key is value.name
			let args = {};
			for(let arg of argumentsArray) {
				let name = arg.name;
				delete arg.name;
				args[name] = arg;
			}

			// console.log("Creating new function", name, "with intent", intent, "and arguments", args);

			const {
				jsFunction,
				properties,
				required
			} = await new Promise(async resolve => {
				const completion = await ChatCompletion.createJsonFromSchema({
					jsFunction: {
						type: "string",
						description: "a js function source code",
					},
					properties: {
						type: "object",
						description: "The properties of the object which is the only argument allowed of the JS function (all arguments are expressed within the object), here is an example arguments object: " + JSON.stringify(EXAMPLE_ARGUMENTS_OBJECT),
						additionalProperties: true
					},
					required: {
						type: "array",
						items: {
							type: "string",
							description: "The required arguments of the function"
						}
					}
				}, {
					name,
					arguments: args,
					intent
				}, [{
					in: {
						name: "add two numbers",
						arguments: {
							number1: { type: "number", description: "the first number to add" },
							number2: { type: "number", description: "the second number to add" }
						},
						intent: "add two numbers"
					},
					out: {
						jsFunction: "function add_two_numbers ({ number1, number2 }) { return number1 + number2; }",
						properties: {
							number1: { type: "number", description: "the first number to add" },
							number2: { type: "number", description: "the second number to add" }
						},
						required: ["number1", "number2"]
					}
				}]);
	
				completion.on("end", (obj) => {
					resolve(obj.json);
				});
			});

			if(!jsFunction) throw new Error("JS Function is required");
			if(!properties) throw new Error("Properties are required");
			if(!required) throw new Error("Required is required");

			tools.add(Tool.createFromJsFn(
				new Function("return " + jsFunction)(),
				properties,
				required
			));

			return "Function \`" + name + "\` created with the intent of \`" + intent + "\`";
		}, {
			name: {
				type: "string",
				description: "The name of the function to create"
			},
			arguments: {
				// these arguments need to be identical to the arguments that this literal object is. somehow express that gpt- but we must do this with arrays and not objects
				type: "array",
				description: "The arguments that the function will take; must be an array of objects with a type and description",
				items: {
					type: "object",
					properties: {
						name: {
							type: "string",
							description: "The name of the argument"
						},
						type: {
							type: "string",
							description: "The type of the argument"
						},
						description: {
							type: "string",
							description: "The description of the argument"
						}
					},
					required: [
						"name",
						"type",
						"description"
					]
				}
			},
			intent: {
				type: "string",
				description: "The purpsoe of the function to create"
			}
		}, [
			"name",
			"args",
			"intent"
		]
	);
	tools.add(createFunctionTool);
	
	
	
	let messages = new Messages();
	messages.add("system", "always speak like you are incredibly sweedish");
	
	// messages.add("user",	 "Hello, how are you?");
	// messages.add("user",	 "tell me about yourself");
	messages.add("user", "create a function that adds two numbers");



	const chatComplete = async (iteration = 0) => {
		const chatCompletion = await ChatCompletion.createTools(messages, tools);
	
		chatCompletion.on("tool_call", async ({ message, toolCall }) => {
			messages.addToolCall(message);
			let response = await tools.handleExecution(toolCall.name, JSON.parse(toolCall.arguments)); // Handle tool call with tools
			messages.addToolCallResponse(toolCall, response);
	
			chatComplete(iteration); // Re-execute the chat completion
		});
	
		chatCompletion.on("start", (obj) => {
			// Message started
			// console.log("starting", obj);
		});
		chatCompletion.on("delta", (obj) => {
			// Message chunk streamed
			// console.log("delta", obj);
		});
		chatCompletion.on("end", (obj) => {
			if(iteration === 0) {
				// function created message repsonse
				messages.addRaw(obj.message);
				console.log("Created function resposne", "\n", obj.message.content, "\n\n");

				const userMessage = "add 5123123124356 and 5123734757178960965423";
				messages.add("user", userMessage);
				console.log("User sent message", "\n", userMessage, "\n\n");
				chatComplete(1);
			} else if(iteration === 1) {
				console.log("AI Response", "\n", obj.message.content);
			}
			// Message finished
			// console.log("end", obj);

		});
	}
	await chatComplete(0);
})();