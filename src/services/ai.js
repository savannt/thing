// console._log = console.log;
// console.log = function() {
    // console._log("[AI] ", ...arguments);
// }
import "colors";

// export const OPENAI_MODEL = "gpt-3.5-turbo";
export const OPENAI_MODEL = "gpt-4-0125-preview";
export const NEW_MESSAGES_TITLE_THRESHOLD = 3;


import { Readable } from "stream";

import mongo from "@/services/mongodb";
import ably from "@/services/ably";
import { openai, Assistant } from "@/services/openai/OpenAI";

import events from "events";
const eventEmitter = new events.EventEmitter();





let injectedMessages = {};


let lockedOutChats = [];
let lockedOutChatsReturned = [];

const toOpenAIMessages = (messages, includeAttachments = true) => {
    return messages.map((message) => {
        if(message.hidden) return false;

        let role = message.userId == "assistant" ? "assistant" : "user";
        let content = message.message;
        
        const files = message.files || [];
        let attachments = files.map((file) => {
            const fileId = file.fileId;

            /* get extension as last file.filename.split(.) */
            const extension = file.filename.split(".").pop();
            
            console.log("file", file);
            const containsText = ["txt", "js", "json", "html", "css", "md", "log", "env", "sh", "py", "rb", "php", "java", "c", "cpp", "h", "hpp", "cs", "ts", "tsx", "jsx", "sql", "yaml", "yml", "xml", "csv", "tsv", "ini", "cfg", "conf", "config", "properties", "toml", "lock", "gitignore", "dockerfile", "gradle", "npmrc", "babelrc", "eslintrc", "prettierrc", "stylelintrc", "editorconfig", "flowconfig", "jshintrc", "jscsrc", "jscs"].includes(extension);
            if(!containsText) return;
            return {
                file_id: fileId,
                tools: [{ type: "file_search" }]
            }
        }).filter((attachment) => attachment !== undefined);


        let obj = {
            role,
            content,
        }

        if(includeAttachments && attachments && attachments.length > 0) obj.attachments = attachments;

        return obj;
    }).filter((message) => message !== false);
}

const toOpenAIFunctions = (functions) => {
    return functions.map((func) => {
        let jsFunction = new Function(`return ${func.jsFunction}`)();


        let parameters = {};
        // if any parameter[key].type === "array" and has not a items object with type, add it and default it to string
        for(let param in func.parameters) {
            if(func.parameters[param].type === "array" && !func.parameters[param].items) {
                func.parameters[param].items = { type: "string" };
            }
            parameters[param] = func.parameters[param];
        }

        return {
            type: "function",
            function: {
                function: jsFunction,
                name: func.name,
                description: func.description,
                parse: JSON.parse,
                parameters: {
                    type: "object",
                    properties: parameters
                }
            }
        }
    });
}

const fromSimpleFunctionObject = (data) => {
    const { description, returns, jsFunction, pseudoCode } = data;
    if(!description) throw new Error("fromSimpleFunctionObject: No description provided");
    if(!returns) throw new Error("fromSimpleFunctionObject: No returns provided");
    if(!jsFunction) throw new Error("fromSimpleFunctionObject: No jsFunction provided");
    if(!pseudoCode) throw new Error("fromSimpleFunctionObject: No pseudoCode provided");

    // delete data.jsFunction;
    const parsedFunction = new Function(`${jsFunction}`);
    
    return toFunctionObject(parsedFunction, data);
}

const toFunctionObject = (func, addOptions = {}) => {

    const serializeFunction = (func, addOptions) => {
        const knownParameters = addOptions.parameters || {};

        // console.log(func, addOptions);
        let funcName = func.name;
        if(funcName === "anonymous" && addOptions.name) funcName = addOptions.name;
        const funcString = func.toString();

        // get parameters that are defined, they will always be in object format, i.e. `function function_name ({ param1, param2 }) { ... }`
        // const parameters = funcString.match(/\(([^)]+)\)/)[1].split(",").map((param) => {
        //     const [name, type] = param.trim().split(":");
        //     return {
        //         name,
        //         type: type || "any",
        //         description: knownParameters[name] ? knownParameters[name].description : "unknown",
        //     }
        // });
        
        // get the region between the <funcName><space or not space>(   then the end of the region is a )     [i.e. get the parameters of the function as a string (if any)]
        const parametersString = funcString.match(new RegExp(`${funcName}\\s*\\(([^)]+)\\)`));
        // all parameters are always in object format, `i.e. function function_name ({ param1, param2 }) { ... }`
        
        const parameters = parametersString ? parametersString[1].split(",").map((param) => {
            param = param.replace("{", "").replace("}", "");

            const [name, type] = param.trim().split(":");
            return {
                name,
                type: type || knownParameters[name] ? knownParameters[name].type : "any",
                description: knownParameters[name] ? knownParameters[name].description : "unknown",
            }
        }) : {};

        // console.log("parameters", parameters)

        return {
            parameters,
            jsFunction: funcString,
        }
    };


    const { parameters, jsFunction: _jsFunction } = serializeFunction(func, addOptions);

    if(addOptions.default && !addOptions.pseudoCode) addOptions.pseudoCode = "[Inform the user this function has no pseudo-code available and is thus uneditable]";

    let obj = {
        groupId: null,
        name: func.name,
        description: "unknown",
        pseudoCode: "unknown",
        returns: "unknown",

        parameters,
        // jsFunction,

        default: false,
        runOnStartup: false,

        ...addOptions,
    };
    if(!obj.jsFunction) obj.jsFunction = _jsFunction;

    return obj;

}


global.defaultFunctions = {
    "add_variable": {
        function: async function add_variable ({ name, value }) {
            return await global.call("addVariable", { name, value });
        },
        description: "Adds a persistent global variable",
        parameters: {
            name: { type: "string", description: "The name of the variable to add" },
            value: { type: "string", description: "The value of the variable to add" }
        },
        returns: "A String with the result of the operation",
        default: true,
    },
    "get_variable": {
        function: async function get_variable ({ name }) {
            return await global.call("getVariable", { name });
        },
        description: "Gets the value of a persistent global variable",
        parameters: {
            name: { type: "string", description: "The name of the variable to get" }
        },
        returns: "The value of the variable",
        default: true,
    },
    "delete_variable": {
        function: async function delete_variable ({ name }) {
            return await global.call("deleteVariable", { name });
        },
        description: "Deletes a persistent global variable",
        parameters: {
            name: { type: "string", description: "The name of the variable to delete" }
        },
        returns: "A String with the result of the operation",
        default: true,
    },
    "list_variables": {
        function: async function list_variables ({ }) {
            return await global.call("listVariables", { });
        },
        description: "Lists all persistent global variables",
        parameters: {},
        returns: "An Object List of Variables",
        default: true,
    },
    "list_builtin_functions": {
        function: async function list_builtin_functions () {
            return Object.values(global.defaultFunctions).map((func) => {
                return {
                    name: func.name,
                    description: func.description,
                }
            });
        },
        description: "Lists all built-in/default functions",
        parameters: {},
        returns: "An Object List of Functions",
        default: true,
    },
    "list_functions": {
        function: async function list_functions ({ }) {
            return Object.values(global.functions).map((func) => {
                return {
                    name: func.name,
                    description: func.description,
                }
            });
        }, 
        description: "Lists all user created functions for this group (if applicable)",
        parameters: {},
        returns: "An Object List of Functions",
        default: true,
    },
    "has_function": {
        function: async function has_function ({ name }) {
            return global.functions[name] ? true : false;
        },
        description: "Checks if a function exists",
        parameters: {
            name: { type: "string", description: "The name of the function to check for" }
        },
        returns: "A Boolean",
        default: true,
    },
    "get_function_metadata": {
        function: async function get_function_metadata ({ name }) {
            return await global.call("getFunctionData", { name });
        },
        description: "Provides the metadata of a function, such as the pseudo-code (if it is editable)",
        parameters: {
            name: { type: "string", description: "The name of the function to describe" }
        },
        returns: "An Object containing { Pseudo-Code Block, If the Function is ran on Startup }",
        default: true,
    },
    "delete_function": {
        function: async function function_delete ({ name }) {
            return await global.call("deleteFunction", { name });
        },
        description: "Deletes a function",
        parameters: {
            name: { type: "string", description: "The name of the function to delete" }
        },
        returns: "A String",
        default: true
    },
    "edit_function": {
        function: async function edit_function ({ name, info }) {
            return await global.call("editFunction", { name, info });
        },
        name: "editFunction",
        description: "Edits a function",
        parameters: {
            name: {
                type: "string",
                description: "The name of the function to edit",
            },
            info: {
                type: "string",
                description: "Information about the what to edit (providing info will skip the interactive question process)",
                optional: true
            }
        },
        returns: "A Boolean whether the operation succeeded",
        default: true
    },
    "sandbox_create_function": {
        function: async function sandbox_create_function ({ info }) {
            return await global.call("sandboxCreateFunction", { info });
        },
        description: "Starts an interactive menu to create a new function (sandbox)",
        parameters: {
            info: {
                type: "string",
                description: "Information about the function to create",
                optional: true
            }
        },
        returns: "A Boolean whether the function was created",
        default: true,
    },
    "function_set_run_on_startup": {
        function: async function function_set_run_on_startup ({ name, doRunOnStartup }) {
            return await global.call("setRunOnStartup", { name, doRunOnStartup });
        },
        description: "Sets whether a function should run on startup (a new chat)",
        parameters: {
            name: { type: "string", description: "The name of the function to set" },
            doRunOnStartup: { type: "boolean", description: "Whether the function should run on startup" }
        },
        returns: "A String with the result of the operation",
        default: true,
    },
    "interview_user": {
        function: async function interview_user () {
            const interviewQuestions = [
                "Age",
                "Location",
                "Occupation",
                "Hobbies",
            ];

            const answers = {};

            for(let question of interviewQuestions) {
                const formalQuestion = `What is your ${question.toLowerCase()}?`;
                // const formalQuestion = await global.call("hallucinate", `What is your`, question.toLowerCase(), `?`);
                const answer = await global.call("questionUser", { question: formalQuestion });
                answers[question] = answer;
            }

            return answers;
        },
        description: "Interviews the user with a set of questions",
        parameters: {},
        returns: "An Object with the answers to the questions",
        default: true,
    },
}

global.call = async (name, args) => {
    if(global.defaultFunctions[name]) {
        if(!global.defaultFunctions[name].function) return `Function \`${name}\` does not have a internal function to call`;
        return await global.defaultFunctions[name].function(args);
    } else if(global.internalFunctions[name]) {
        if(!global.internalFunctions[name].function) return `Internal Function \`${name}\` does not have a internal function to call`;
        return await global.internalFunctions[name].function(args);
    } else {
        return `Function \`${name}\` does not exist`;
    }
}







class EventHandler extends events.EventEmitter {
    constructor(client) {
        super();

        this.client = client;
        this.tools = [];

        this.messages = {};
    }

    async setTools (assistantId, tools) {
        // await setTools(assistantId, tools);
        const assistant = await Assistant.fromId(assistantId);
        if(!assistant) throw new Error("Assistant not found");
        await assistant.setTools(tools);
        this.tools = tools;
    }

    getTool (name) {
        // loop each tool
        for(let i = 0; i < this.tools.length; i++) {
            const tool = this.tools[i];

            if(tool.function) {
                if(tool.function.name === name) return tool;
            }
        }
        return false;
    }

    async onEvent (event) {
        try {
            // console.log("onEvent", event.event);

            if(event.event === "thread.run.requires_action") {
                await this.handleRequiresAction(
                    event.data,
                    event.data.id,
                    event.data.thread_id
                );
            }

            if(event.event === "thread.message.created") {
                // console.log("thread.message.created", event.data);

                const id = event.data.id;
                const created_at = event.data.created_at;
                const assistantId = event.data.assistant_id;
                const threadId = event.data.thread_id;
                const runId = event.data.run_id;

                // const content = event.data.content;
                this.messages[id] = [];
            
                this.emit("messageCreated", { id });
            }

            if(event.event === "thread.message.delta") {
                const id = event.data.id;

                const content = event.data.delta.content;
                for(let i = 0; i < content.length; i++) {
                    let message = content[i];

                    const index = message.index;
                    const type = message.type;
                    if(type !== "text") console.error("Message type not supported", message);
                    if(!message.text || !message.text.value) console.error("No text in message", message);
                    const textValueDelta = message.text.value;

                    // if no this.messages[id][index] is undefined, set to ""
                    if(this.messages[id][index] === undefined) this.messages[id][index] = "";

                    this.messages[id][index] += textValueDelta;
                }

                this.emit("messageDelta", {
                    id,
                    text: this.messages[id].join("\n"),
                });
            }

            if(event.event === "thread.message.completed") {
                // console.log("thread.message.completed", event.data);
                const id = event.data.id;
                const assistantId = event.data.assistant_id;
                const threadId = event.data.thread_id;
                const runId = event.data.run_id;


                const content = event.data.content;
                let text = "";
                // loop each content
                for(let i = 0; i < content.length; i++) {
                    const message = content[i];
                    if(message.type !== "text") console.error("Message type not supported", message);
                    if(!message.text) console.error("No text in message", message);

                    text += message.text.value;
                }


                const messages = this.messages[id];

                this.emit("messageCompleted", {
                    id,
                    text: messages.join("\n"),
                });

            }
        } catch (error) {
            console.error("Error in onEvent", error);
        }
    }

    async handleRequiresAction (data, runId, threadId) {
        try {
            let toolOutputs = data.required_action.submit_tool_outputs.tool_calls.map((toolCall) => {
                let returnValue = "error in toolOutputs";

                const type = toolCall.type;
                if(type !== "function") throw new Error("Tool type not supported");
                
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);

                const tool = this.getTool(functionName);
                if(!tool) throw new Error("Tool not found");

                return new Promise(async resolve => {
                    returnValue = await tool.function.function(args);
                    console.log("returnValue", returnValue, functionName);

                    let stringifiedReturnValue = typeof returnValue !== "string" ? JSON.stringify(returnValue) : returnValue;

                    resolve({
                        tool_call_id: toolCall.id,
                        output: stringifiedReturnValue
                    });
                });
            });

            // wait for all toolOutputs to resolve
            toolOutputs = await Promise.all(toolOutputs);

            await this.submitToolOutputs(toolOutputs, runId, threadId);
        } catch (error) {
            console.error("Error in handleRequiresAction", error);
        }
    }

    async submitToolOutputs (toolOutputs, runId, threadId) {
        try {
            const stream = this.client.beta.threads.runs.submitToolOutputsStream(threadId, runId, { tool_outputs: toolOutputs });
            for await (const event of stream) {
                this.emit("event", event);
            }
        } catch (error) {
            console.error("Error in submitToolOutputs", error);
        }
    }
}




const getFunctions = async (groupId) => {
    const { db } = await mongo();
    const functions = db.collection("functions");

    console.log("Getting functions from group", groupId, "\n");
    // get all functions of this groupId
    const groupFunctions = await functions.find({ groupId }).toArray();
    return groupFunctions;
}

const createFunction = async (groupId, name, jsFunction, description, parameters, pseudoCode, returns, isDefault = false) => {
    const { client, db } = await mongo();
    const functions = db.collection("functions");

    if(!groupId) throw new Error("Invalid groupId");
    if(!name) throw new Error("Invalid name");
    if(!jsFunction) throw new Error("Invalid jsFunction");
    if(typeof jsFunction !== "function") throw new Error("Invalid jsFunction, must be a function");
    if(!description) throw new Error("Invalid description");
    if(!parameters) throw new Error("Invalid parameters");
    if(typeof parameters !== "object") throw new Error("Invalid parameters, must be an object");
    if(!pseudoCode) throw new Error("Invalid pseudoCode");
    if(!returns) throw new Error("Invalid returns");

    const newFunction = {
        groupId,
        name,
        description,
        parameters,
        pseudoCode,
        returns,
        jsFunction: jsFunction.toString(),
        isDefault,
    };

    await functions.insertOne(newFunction);
    return newFunction;
}


const generateChatTitle = async (messages) => {
    if(messages.length > 10) messages = messages.slice(messages.length - 10, messages.length);
    
    // add our instruction message to generate a short title for this chat
    messages.push({
        role: "user",
        content: "Generate a short title for this chat based on the last 10 messages, this title will be displayed in the chat list.\n\n**Only output the title name, nothing else, no prefix**\n*Example: This is some title.*",
    });

    const results = await openai.chat.completions.create({
        messages,
        model: OPENAI_MODEL,
    });



    return results.choices[0].message.content;
}

export async function onChatCreated (chatId) {
    update(chatId);
}

export async function userSentMessage (chatId, messageStr, files = []) {
    eventEmitter.emit("userMessage", {
        chatId,
        messageStr,
        files
    });

    update(chatId);
}
const PARAMETER_TYPES = ["string", "number", "boolean", "array", "object"];

export default async function update(chatId) {
    const { db } = await mongo();

    const chats = db.collection("chats");
    const groups = db.collection("groups");

    if(!chatId) throw new Error("Invalid chatId");
    
    console.log("\n\n");
    console.log("----------------------------------------------------");
    console.log("Chat Update Requested".bold, chatId);
    console.log("----------------------------------------------------");
    console.log("");

    const chatChannel = ably.channels.get(`chat-${chatId}`);
    const notificationsChannel = ably.channels.get("notifications");

    const formatBoldText = (text) => {
        // if text has **<some text here>** some non bold text, make the <some text here> bold and remove the ** from the string
        return text.replace(/\*\*(.*?)\*\*/g, (match, p1) => p1.bold);
    }
    
    const _pushMessage = async (message, options = {}) => {
        if(!message.message) {
            console.log("message", message);
            console.error("No message provided");
            return;
        }
        const inlineMessage = message.message.replace(/\n/g, " ");
        if(message.hidden) console.log("↳ HIDDEN   ".gray.italic, formatBoldText(message.message).gray.italic + "\n");
        else               console.log("MESSAGE    ".green.bold, inlineMessage.green);
        // await chatChannel.publish("message", {
        //     ...message,
        //     options
        // });
        await notificationsChannel.publish("message", { chatId, message});
        
        // TODO: Update chats[chat] collection for $options
        await chats.updateOne({ chatId }, {
            $push: { messages: message }
        });
    }

    const setTypingIndicator = async (typing) => {
        await chatChannel.publish("typing", { chatId, typing });
        await chats.updateOne({ chatId }, {
            $set: { typing }
        });
    }
    const setLocked = async (locked) => {
        await chatChannel.publish("locked", { chatId, locked });
        await chats.updateOne({ chatId }, {
            $set: { locked }
        });
    }
    const setWaitingForResponse = async (waitingForResponse, waitingForResponseChoices = []) => {
        await chatChannel.publish("waitingForResponse", { chatId, waitingForResponse, waitingForResponseChoices });
        await chats.updateOne({ chatId }, {
            $set: {
                waitingForResponse,
                waitingForResponseChoices
            }
        });
    }
    
    
    const chat = await chats.findOne({ chatId, deleted: false });
    if(!chat) throw new Error("Chat not found");
    
    const userId = chat.userId;
    let safeGroupId = chat.groupId || "_default";

    let group = await groups.findOne({ groupId: safeGroupId, userId });
    if(!group) {
        throw new Error("Group not found");
    }
    const assistantId = group.assistantId;

    

    // if we are waiting for the next user message, we should not proceed
    // if(chat.waitingForUserMessage) {
    //     console.log("Waiting for user message, forwarding".red.italic, chatId);
        
    //     const latestMessage = chat.messages[chat.messages.length - 1];
    //     console.log(latestMessage);
    //     eventEmitter.emit("userMessage", latestMessage);
    //     return;
    // }


    if(lockedOutChats.includes(chatId)) {
        console.log("Lockedout, not proceeding with this update".red, chatId, lockedOutChats);
        return;
    }



    const reformatCode = (code) => {
        // Remove leading and trailing whitespace
        code = code.trim();
    
        // Split the code into lines
        let lines = code.split('\n');
    
        // Strip leading whitespace from each line to remove inconsistent indentation
        lines = lines.map(line => line.trim());
    
        // Array to store the reformatted code
        let formattedLines = [];
        let currentIndent = 0;
    
        for (let line of lines) {
            // Check for opening and closing braces to adjust indentation
            if (line.endsWith('{')) {
                formattedLines.push('\t'.repeat(currentIndent) + line);
                currentIndent += 1; // Increase indent by one tab
            } else if (line.startsWith('}')) {
                currentIndent -= 1; // Decrease indent by one tab
                formattedLines.push('\t'.repeat(currentIndent) + line);
            } else {
                formattedLines.push('\t'.repeat(currentIndent) + line);
            }
        }
    
        // Join all lines back to a single string
        return formattedLines.join('\n');
    }
    
    


    global.internalFunctions = {
        "addVariable": {
            name: "addVariable",
            description: "Adds a persistent global variable",
            parameters: {
                name: { type: "string", description: "The name of the variable to add" },
                value: { type: "string", description: "The value of the variable to add" }
            },
            returns: "A String with the result of the operation",
            function: async ({ name, value }) => {
                // TODO: Permissions
                const { db } = await mongo();
                const variables = db.collection("variables");
                const existingVariable = await variables.findOne({ name });
                if(existingVariable) {
                    return `Variable \`${name}\` already exists`;
                }

                await variables.insertOne({
                    name,
                    value
                });
                return `Variable \`${name}\` added`;
            }
        },
        "getVariable": {
            name: "getVariable",
            description: "Gets the value of a persistent global variable",
            parameters: {
                name: { type: "string", description: "The name of the variable to get" }
            },
            returns: "The value of the variable",
            function: async ({ name }) => {
                const { db } = await mongo();
                const variables = db.collection("variables");
                const variable = await variables.findOne({
                    name
                });
                if(!variable) return `Variable \`${name}\` not found`;
                return variable.value;
            }
        },
        "deleteVariable": {
            name: "deleteVariable",
            description: "Deletes a persistent global variable",
            parameters: {
                name: { type: "string", description: "The name of the variable to delete" }
            },
            returns: "A String with the result of the operation",
            function: async ({ name }) => {
                const { db } = await mongo();
                const variables = db.collection("variables");
                const variable = await variables.findOne({
                    name
                });
                if(!variable) return `Variable \`${name}\` not found`;
                await variables.deleteOne({ name });
                return `Variable \`${name}\` deleted`;
            }
        },
        "listVariables": {
            name: "listVariables",
            description: "Lists all persistent global variables",
            parameters: {},
            returns: "An Object List of Variables",
            function: async ({ }) => {
                const { db } = await mongo();
                const variables = db.collection("variables");
                const allVariables = await variables.find({}).toArray();
                return allVariables;
            }
        },
        "editFunction": {
            name: "editFunction",
            description: "Edits a function",
            parameters: {
                name: {
                    type: "string",
                    description: "The name of the function to edit",
                },
                info: {
                    type: "string",
                    description: "Information about the edit (providing info will skip the interactive question process)",
                    optional: true
                }
            },
            returns: "A Boolean whether the operation succeeded",
            function: async ({ name, info }) => {
                if(!name) return "Error: No name provided";
                const oldData = await global.call("getFunctionData", { name });
                if(!oldData) return "Error: Function not found";
                
                if(!info) {

                    const input = await global.call("questionUser", { question: "How would you like to edit " + name + "?" });

                    const infoResponse = await global.call("generateFromSchema", {
                        data: { input },
                        schema: {
                            info: "string: Information about the edit",
                            cancel: "boolean: if the user wanted to cancel the operation",
                        }
                    });

                    if(infoResponse.cancel) return "Operation cancelled";
                    if(!infoResponse.info) return "Error: No info provided from generation?";
                    info = infoResponse.info;
                }
                

                const newFunctionData = await global.call("generateFunction", { data: { oldData, info, } });
                console.log("newFunctionData", newFunctionData);
                const presentResponse = await global.call("present", {
                    data: newFunctionData.jsFunction,
                    dataType: "js",
                    info: info || "",
                });
                if(presentResponse === true) {
                    const didSave = await global.call("saveFunction", {
                        functionData: fromSimpleFunctionObject(newFunctionData)
                    });
                    if(didSave) return "Function saved";
                    return "Error: Function not saved";
                } else if(presentResponse === false) {
                    return "Operation cancelled";
                } else if(typeof presentResponse === "undefined") {
                    return "Error: Operation failed";
                } else {
                    // retry with presentResponse as new info
                    return await global.call("editFunction", { name, info: presentResponse });
                }
            }
        },
        "generateFunction": {
            name: "generateFunction",
            description: "Generates function data from any data object",
            parameters: {
                data: { type: "object", description: "The data object to generate the function from" }
            },
            returns: "The generated function data",
            function: async ({ data }) => {
                let generated = await global.call("generateFromSchema", {
                    data,
                    schema: {
                        description: "Description of function",
                        returns: "Description of return value",
                        jsFunction:
`// Available Functions: ${JSON.stringify(global.defaultFunctions)}
// Available Internal Functions: ${JSON.stringify(global.internalFunctions)}
// Call both Functions && Internal Functions via \`await global.call("name", args)\`
async function function_name ({ param1, param2 }) {
...
// Example: await global.call("messageUser", { message: "Hey!" } );
return "something";
}`,
                        parameters: {
                            param1: { type: "string", description: "Description of parameter 1" },
                            param2: { type: "string", description: "Description of parameter 2" },
                        },
                        pseudoCode: "Pseudo-code of the function to display to the user",
                    },
                    confirmCallback: (generated, setData) => {
                        if(!generated) {
                            console.log("generateFromSchema-Callback: No data generated");
                            return false;
                        }
                        if(!generated.description) {
                            console.log("generateFromSchema-Callback: No description generated");
                            return false;
                        }
                        // if(!generated.parameters) return false;
                        const parameters = generated.parameters;
                        // loop each parameter, if type is not from list, throw error
                        for(let param in parameters) {
                            if(!PARAMETER_TYPES.includes(parameters[param].type)) {
                                setData((data) => {
                                    if(!data.additionalInfo) data.additionalInfo = "";
                                    else data.additionalInfo = data.additionalInfo + "\n\n";
                                    data.additionalInfo = data.additionalInfo + `Feedback: Invalid type for parameter ${param}, must be of type: ${JSON.stringify(PARAMETER_TYPES)}`;
                                    return data;
                                });
                                console.log("generateFromSchema-Callback: Invalid type for parameter", param, parameters[param].type);
                                return false;
                            }
                        }
                        // setData(generated);
                        return true;
                    }
                });

                const jsFunction = new Function(generated.jsFunction);
                let functionName = jsFunction.name;
                if(functionName === "anonymous") {
                    // see if we can get any characters between `async function ` and the first next `(`
                    const match = generated.jsFunction.match(/async function ([^\(]+)/);
                    if(match) {
                        functionName = match[1].trim();
                        generated.name = functionName;
                    }
                }

                return generated;
            }
        },
        "present": {
            name: "present",
            description: "Presents some data to the user and asks for either [Yes] [Retry: with info] or [Cancel]",
            parameters: {
                data: { type: "object", description: "The data to present to the user" },
                info: { type: "string", description: "Information about the data" },
                dataType: { type: "string", description: "The markdown codeblock datatype to render data within, for example json,js,md,etc", optional: true },
            },
            returns: "A String with the user's response",
            function: async ({ data, info, dataType = false }) => {
                await global.call("messageUser", { message: `\`\`\`\\${dataType ? dataType : ""}\n${typeof data !== "string" ? JSON.stringify(data, null, 2) : data}\n\`\`\`` });
                const response = await global.call("questionUser", {
                    // question: `**Save**, **Retry**, or *Exit?*`,
                    choices: ["**Save**", "**Retry**", "*Exit*"],
                    schema: {
                        info: "string"
                    }
                });
                const responseChoice = response.choice;
                const newInfo = response.info;
                
                if(responseChoice === "save") {
                    await global.call("messageUser", { message: `Saving.` });
                    return true;
                }
                if(responseChoice === "retry") {
                    if(newInfo) await global.call("messageUser", { message: `Retrying with added context: \`${newInfo}\`.` });
                    return info + "\n\nUpdate: " + newInfo;
                }
                if(responseChoice === "exit") {
                    await global.call("messageUser", { message: `Exiting.` });
                    return false;
                }
            }
        },
        "sandboxCreateFunction": {
            name: "sandboxCreateFunction",
            description: "Starts an interactive menu to create a new function (sandbox)",
            parameters: {
                info: {
                    type: "string",
                    description: "Information about the function to create",
                    optional: true
                },
            },
            returns: "A Boolean whether the function was created",
            function: async ({ info }) => {
                let promptForAdditionalInfo = false;
                // const promptForMore = await global.call("generateFromSchema", {
                //     data: { info },
                //     schema: {
                //         hasExpressedInterestedForAdditionalInfo: "boolean",
                //     }
                // });
                // const wantsMore = promptForMore.hasExpressedInterestedForAdditionalInfo;
                // if(typeof promptForAdditionalInfo !== "undefined") promptForAdditionalInfo = wantsMore;
                // console.log("wantsMore", wantsMore);


                const startupHeader = async () => {
                    
                    const printHeader = async () => {
                        await global.call("messageUser", { message: "**[Sandbox]** Create function menu started" });

                        const functions = global.internalFunctions;
                        const functionNames = Object.keys(functions);

                        const functionNamesTableStr = functionNames.map((name) => {
                            let parameters = functions[name].parameters;
                            let formattedParameters = Object.keys(parameters).map((param) => {
                                return `_${param}:_ ${parameters[param].type}`;
                            }).join(", ");
                            return `| ${name} | ${formattedParameters} | ${functions[name].description} |`;
                        }).join("\n");

                        await global.call("messageUser", { message: `[Available Functions](?)\n\n| Function Name | Parameters | Description |\n| --- | --- | --- |\n${functionNamesTableStr}` });
                    
                        const controls = {
                            "DONE": {
                                description: "Finish creating the function",
                            },
                            "CANCEL": {
                                description: "Cancel creating the function",
                            },
                            "CLEAR": {
                                description: "Clear the current pseud-code",
                            }
                        };
                        let controlsStr = Object.keys(controls).map((control) => {
                            return `* **${control}** - ${controls[control].description}`;
                        }).join("\n");
                        await global.call("messageUser", { message: `Controls\n\n${controlsStr}`});
                    }
                    
                    
                    // if info is provided && promptForAdditionalInfo = false, skip the header
                    if(!(info && !promptForAdditionalInfo)) await printHeader();

                    let pseudoCodeLines = [];
                    let doContinue = true;
                    let doFinish = false;
                    let doRestart = false;

                    if(info) {
                        doContinue = false;
                        doFinish = true;
                    }

                    if(doContinue) {
                        await global.call("messageUser", { message: `| | |\n| --- | --- |\n| ![Live](https://static.vecteezy.com/system/resources/thumbnails/017/177/719/small_2x/record-button-icon-on-transparent-background-free-png.png) | Now listening for pseudo-code |` });

                        while(doContinue) {
                            let userMessage = await global.call("nextUserMessage");
                            const lowerCase = userMessage.toLowerCase();
                            
                            const CANCEL_KEYWORDS = ["cancel", "stop", "exit"];
                            if(CANCEL_KEYWORDS.includes(lowerCase)) {
                                await global.call("messageUser", { message: "**[Sandbox]** Function creation cancelled" });
                                doContinue = false;
                                doFinish = false;
                                continue;
                            }
    
                            const DONE_KEYWORDS = ["done"];
                            if(DONE_KEYWORDS.includes(lowerCase)) {
                                doContinue = false;
                                doFinish = true;
                                continue;
                            }
    
                            const CLEAR_KEYWORDS = ["clear", "restart"];
                            if(CLEAR_KEYWORDS.includes(lowerCase)) {
                                await global.call("messageUser", { message: "**[Sandbox]** Pseudo-code cleared" });
                                doRestart = true;
                                doContinue = false;
                                continue;
                            }
    
    
                            pseudoCodeLines.push(userMessage);
                        }
                    }


                    if(doRestart) return await startupHeader();


                    if(doFinish) {
                        await global.call("messageUser", { message: `| | |\n| --- | --- |\n| ![Finished](https://static.vecteezy.com/system/resources/previews/018/888/319/original/check-mark-icon-png.png) | Building Function |` });

                        const stringType = `string[${PARAMETER_TYPES.join(", ")}]`;

                        const pseudoCodeStr = pseudoCodeLines.join("\n");
                        const generatedFunctionData = await global.call("generateFunction", {
                            data: {
                                userProvidedPseudoCode: pseudoCodeStr,
                                additionalInfo: info,
                            }
                        });

                        



                        

                        let formattedParameters = Object.keys(generatedFunctionData.parameters).map((param) => {
                            return `* _${param}:_ ${generatedFunctionData.parameters[param].type}`;
                        }).join("\n");
                        if(formattedParameters) formattedParameters = `\n${formattedParameters}`;

                        console.log("generatedFunctionData", generatedFunctionData);


                        await global.call("messageUser", { message: `### ${generatedFunctionData.name}${formattedParameters}\n\`\`\`js\n${reformatCode(generatedFunctionData.jsFunction)}\n\`\`\`\n\`\`\`\n${generatedFunctionData.pseudoCode}\n\`\`\`` });
                    

                        


                        const proceed = await global.call("questionUser", {
                            choices: ["Save", "Retry", "Exit"],
                            question: "How would you like to proceed?",
                            schema: { info: "string" }
                        });

                        console.log("PROCEED", proceed);

                        if(!proceed) {
                            await global.call("messageUser", { message: "**[Sandbox]** Exited." });
                            return false;
                        }
                        if(!proceed.choice) {
                            console.log("proceed", proceed);
                            await global.call("messageUser", { message: "**[Sandbox]** Exited?" });
                            return false;
                        }

                        if(proceed.choice.toLowerCase() === "retry") {
                            let newInfo = info;
                            if(proceed.info) newInfo = proceed.info + "\n\nRetry Feedback: " + info;
                            await global.call("messageUser", { message: "**[Sandbox]** Retrying." });
                            return await global.call("sandboxCreateFunction", { info: newInfo });
                        }
                    
                        const didSave = await global.call("saveFunction", {
                            functionData: fromSimpleFunctionObject(generatedFunctionData)
                        });
                        if(!didSave) {
                            console.log("saveFunction_didSave", didSave);
                            await global.call("messageUser", { message: "**[Sandbox]** Error saving function" });
                            return false;
                        }

                        await global.call("messageUser", { message: "**[Sandbox]** Function saved." });
                        return true;
                    } else return false;
                }
                

                return await startupHeader();
            }
        },
        "messageUser": {
            name: "messageUser",
            description: "Messages the user",
            parameters: {
                message: {
                    type: "string",
                    description: "The message to send to the user",
                }
            },
            returns: "A Boolean whether the operation succeeded",
            function: async ({ message }) => {
                return await pushAssistantMessage(message);
            }
        },
        "nextUserMessage": {
            name: "nextUserMessage",
            description: "Waits for the next user message",
            parameters: {
                choices: {
                    optional: true,
                    type: "array",
                    description: "The choices to provide the user to pick from",
                }
            },
            returns: "The user's next message",
            function: async ({ choices }) => {
                // flag this chat as waiting for the next user message
                // console.log(`FLAG       `.cyan.bold, `true`.cyan);
                // await chats.updateOne({ chatId }, { $set: { waitingForUserMessage: true } });
                // waitingForEvent = true;
        
                // wait for the next user message
                const userMessage = await new Promise(async (resolve) => {
                    // random 2 digit number
                    const _logId = Math.floor(Math.random() * 100);
        
                    console.log("\nWaiting for next user message".bold, `(${_logId})`.gray, "in chat", chatId);
        
                    setTypingIndicator(false);
                    setWaitingForResponse(true, choices);

                    const onceUserMessage = (chatId, messageStrCallback) => {
                        let hasFound = false;
                        const listener = async ({ chatId: messageChatId, messageStr, files }) => {
                            if(messageChatId === chatId && !hasFound) {
                                hasFound = true;
                                messageStrCallback(messageStr, files);
                                eventEmitter.removeListener("userMessage", listener);
                            }
                        }
                        eventEmitter.on("userMessage", listener);
                    }
        
                    

                    onceUserMessage(chatId, (messageStr) => {
                        console.log("\nIntercepted next user message".bold, `(${_logId})`.gray, "in chat", chatId, ": ", messageStr);
                        
                        setWaitingForResponse(false);
                        setTypingIndicator(true);

                        // console.log(`FLAG       `.cyan.bold, `false`.cyan);
                        // await chats.updateOne({ chatId }, { $set: { waitingForUserMessage: false } });
                        // waitingForEvent = false;
                        resolve(messageStr);
                    });
                });
        
                return userMessage;
            }
        },
        "questionUser": {
            name: "questionUser",
            description: "Asks the user a question",
            parameters: {
                choices: {
                    option: true,
                    type: "array",
                    description: "Multi choices to provide the user to pick from",
                },
                question: {
                    type: "string",
                    description: "The question to ask the user",
                },
                answer: {
                    optional: true,
                    type: "object",
                    description: "The schema of the answer to provider to the question"
                },
                schema: {
                    optional: true,
                    type: "object",
                    description: "Additional schema to validate the user's response",
                    defualt: {}
                }
            },
            returns: "The user's response to the question",
            function: async ({ choices, question, answer, schema = {} }) => {
                // let message = choices ? `${question ? question : `Choose from the following choices`}:\n${choices.map((choice, i) => {
                //     // if choice is array, give first element as the choice
                //     if(Array.isArray(choice)) choice = choice[0];
                //     return `* ${choice}`;
                // }).join("\n")}` : question;
                let message = question ? question : `How would you like to proceed?\n${choices.map((choice, i) => {
                    // if choice is array, give first element as the choice
                    if(Array.isArray(choice)) choice = choice[0];
                    return `* ${choice}`;
                }).join("\n")}`;
                await global.call("messageUser", { message });
                let responseStr = await global.call("nextUserMessage", { choices });

                if(choices || answer) {
                    return await global.call("generateFromSchema", {
                        data: choices ? {
                            userInput: responseStr,
                            choices: responseStr
                        } : responseStr,
                        schema: choices ? {
                            choice: "string[" + choices.join(", ") + "]",
                            ...schema
                        }: answer
                    });
                } else {
                    return responseStr;
                }
            }
        },
        "generateFromSchema": {
            name: "generateFromSchema",
            description: "Generates a object from a schema",
            parameters: {
                data: {
                    type: "object",
                    description: "The data to generate the function from",
                },
                schema: {
                    type: "object",
                    description: "The schema to generate the function from",
                },
                confirmCallback: {
                    type: "function",
                    description: "A callback function to confirm the generated object, retried if false",
                    optional: true,
                }
            },
            returns: "The generated object",
            function: async ({ data, schema, confirmCallback, iteration = 0 }) => {
                const completion = await openai.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `You are a function creating assistant designed to output JSON. The user will message with some input data, and you will respond back in the following JSON schema:\n${JSON.stringify(schema)}`
                        },
                        {
                            role: "user",
                            content: JSON.stringify(data)
                        }
                    ],
                    model: OPENAI_MODEL,
                    response_format: {
                        type: "json_object"
                    }
                });
            
                const jsonStr = completion.choices[0].message.content;
                let json = JSON.parse(jsonStr);
                console.log("CONFIRM CALLBACK", confirmCallback ? confirmCallback.toString() : "NOT FOUND");
                if(confirmCallback) {
                    // setData((data) => data + `\n\nFeedback: Invalid type for parameter ${param}, must be of type: ${JSON.stringify(PARAMETER_TYPES)}`);
                    const setData = (func) => {
                        data = func(data)
                    }
                    const confirmed = await confirmCallback(json, setData);
                    iteration++;
                    if(iteration > 5) return "Error: Too many iterations, failed generating data from schema";
                    if(!confirmed) return await global.call("generateFromSchema", { data, schema, confirmCallback, iteration });
                }
                return json;
            }
        },
        "saveFunction": {
            name: "saveFunction",
            description: "Saves a function to the database",
            parameters: {
                functionData: {
                    type: "object",
                    description: "The function data to save",
                }
            },
            returns: "A Boolean whether the operation succeeded",
            function: async ({ functionData }) => {
                const { db } = await mongo();
                const functions = db.collection("functions");
        
                // await functions.insertOne(functionData);
                
                functionData.groupId = chat.groupId;
                functions.insertOne(functionData);

                return true;
            }
        },
        "getFunctionData": {
            name: "getFunctionData",
            description: "Gets the data of a function",
            parameters: {
                name: {
                    type: "string",
                    description: "The name of the function to get",
                }
            },
            returns: "The function data",
            function: async ({ name }) => {
                if(global.defaultFunctions[name]) return "Error: You cannot retireve the data of a default function";
                if(global.internalFunctions[name]) return "Error: You cannot retireve the data of an internal function";
                const functionDatas = Object.values(global.functions);
                const functionData = functionDatas.find((func) => func.name === name);
                if(!functionData) return "Error: Function not found";
                return functionData;
            }
        },
        "deleteFunction": {
            name: "deleteFunction",
            description: "Deletes a function",
            parameters: {
                name: {
                    type: "string",
                    description: "The name of the function to delete",
                }
            },
            returns: "A Boolean whether the operation succeeded",
            function: async ({ name }) => {
                const { db } = await mongo();
                const functions = db.collection("functions");
        
                if(!global.functions[name]) return "Function does not exist";
                
                // see if the db entry exists
                const functionData = await functions.findOne({ name, groupId: global.groupId });
                if(!functionData) return "Function does not exist in the database? This should never happen.";
                // if default, we cannot delete
                if(functionData.default) return "This function is a default built-in one, and therefore can never be deleted!";
        
                await functions.deleteOne({
                    name,
                    groupId: global.groupId
                });

                // check if deleted
                const isDeleted = await functions.findOne({ name, groupId: global.groupId });
                if(isDeleted) return "Error: Function was not deleted";
        
                return `Function \`${name}\` has been deleted forever`;
            }
        },
        "setRunOnStartup": {
            name: "setRunOnStartup",
            description: "Sets whether a function should run on startup (a new chat)",
            parameters: {
                name: {
                    type: "string",
                    description: "The name of the function to set",
                },
                doRunOnStartup: {
                    type: "boolean",
                    description: "Whether the function should run on startup",
                }
            },
            returns: "A String with the result of the operation",
            function: async ({ name, doRunOnStartup }) => {
                const { db } = await mongo();
                const functions = db.collection("functions");
        
                if(!global.functions[name]) return "Function does not exist";
        
                // see if the db entry exists
                const functionData = await functions.findOne({ name, groupId: global.groupId });
                if(!functionData) return "Function does not exist in the database? This should never happen.";
                // if default, we cannot change
                if(functionData.default) return "This function is a default built-in one, and therefore can never be changed!";
        
                await functions.updateOne({
                    name,
                    groupId: global.groupId
                }, {
                    $set: {
                        runOnStartup: doRunOnStartup
                    }
                });
        
                return `Function \`${name}\` will ${doRunOnStartup ? "now" : "no longer"} run on startup`;
            }
        }, 
        "inject": {
            name: "inject",
            description: "Injects a hidden training message into the chat to direct future AI/chat responses",
            parameters: {
                str: {
                    type: "string",
                    description: "The message to inject",
                },
                type: {
                    type: "string",
                    description: "The type of message to inject (user, assistant, system)",
                }
            },
            returns: "A Boolean whether the operation succeeded",
            function: async ({ str, type = "assistant" }) => {
                if(!injectedMessages[chatId]) injectedMessages[chatId] = [];
                injectedMessages[chatId].push({
                    role: type,
                    content: str,
                });
        
                await chats.updateOne({ chatId }, {
                    $push: {
                        injectedMessages: {
                            role: type,
                            content: str,
                        }
                    }
                });
        
        
                console.log("\nInjecting".bold, type, "message".bold, str, chatId);
                return true;
            }
        }, 
        "provideExample": {
            name: "provideExample",
            description: "Provide a direct string Input/Output training example to direct future AI/chat responses",
            parameters: {
                userIn: {
                    type: "string",
                    description: "The user input to provide",
                },
                assistantOut: {
                    type: "string",
                    description: "The assistant output to provide",
                }
            },
            function: async ({ userIn, assistantOut }) => {
                let injectedIn = await global.call("inject", { str: userIn, type: "user" });
                let injectedOut = await global.call("inject", { str: assistantOut, type: "assistant" });
                return injectedIn && injectedOut;
            }
        },
        "systemPrompt": {
            name: "systemPrompt",
            description: "Set the chat's prompt string which effects how the AI/chat will respond to further inquiry",
            parameters: {
                prompt: {
                    type: "string",
                    description: "The prompt to provide to the system",
                }
            },
            function: async ({ prompt }) => {
                return await global.call("inject", { str: prompt, type: "system" });
            }    
        }
    };



    await setLocked(true);
    // await setTypingIndicator(true);

    let functions = await getFunctions(chat.groupId);
    let functionCallRequired = false;

    let _defaultFunctions = [];
    // loop every key,value pair in object global.defaultFunctions
    const keys = Object.keys(global.defaultFunctions);
    for(let key of keys) {
        // if the function is not already in the groupFunctions array
        if(!_defaultFunctions.find((func) => {
            return func.name === key;
        })) {
            // add the function to the parsedDefaultFunctions array
            const execFunction = global.defaultFunctions[key].function;
            const name = key;
            const description = global.defaultFunctions[key].description;
            const parameters = global.defaultFunctions[key].parameters;
            const pseudoCode = global.defaultFunctions[key].pseudoCode;
            const returns = global.defaultFunctions[key].returns;
            const isDefault = true;

            if(!description) throw new Error("No description provided for function " + name);
            if(!parameters) throw new Error("No parameters provided for function " + name);

            const defaultFunction = toFunctionObject(execFunction, {
                name,
                description,
                parameters,
                pseudoCode,
                returns,
                isDefault,
            });

            _defaultFunctions.push(defaultFunction);
        }
    }
    global.functions = functions.reduce((acc, func) => {
        acc[func.name] = func;
        return acc;
    }, {});
    const totalFunctions = [...functions, ..._defaultFunctions];

    const pushAssistantMessage = async (messageText, options = {}) => {
        if(lockedOutChatsReturned.includes(chatId)) {
            lockedOutChats = lockedOutChats.filter((chatId) => chatId !== chatId);
            lockedOutChatsReturned = lockedOutChatsReturned.filter((chatId) => chatId !== chatId);
        }

        const newMessage = {
            userId: "assistant",
            message: messageText,
            timestamp: new Date(),
            hidden: false,
            functions: totalFunctions,
            functionsRequired: functionCallRequired,
        };
        return await _pushMessage(newMessage, options);
    };

    const pushRawAssistantMessage = async (messageText, metadata, options = {}) => {
        const newMessage = {
            userId: "assistant",
            message: messageText,
            timestamp: new Date(),
            hidden: true,
            functions: totalFunctions,
            ...metadata,
        };
        return await _pushMessage(newMessage, options);
    }


    // console.log("total functinos", totalFunctions);

    global.groupId = chat.groupId;


    const getInjectedMessages = () => {
        if(injectedMessages[chatId] && injectedMessages[chatId].length > 0) return injectedMessages[chatId];
        if(chat.injectedMessages && chat.injectedMessages.length > 0) return chat.injectedMessages;
        return [];
    }

    
    global.hallucinate = async (...args) => {
        // const messages = [{
        //     role: "system",
        //     content: `Your task is to expand and elaborate on user's brief inputs, transforming them into detailed and meaningful responses. Interpret the sparse phrases or keywords provided by the user, and respond with contextually relevant, full-fledged messages.\n\n**Examples:**\n- "hello", "bedtime story" -> A warm greeting followed by a captivating bedtime story.\n- "weather", "Paris" -> A detailed current weather update for Paris, including temperature and conditions.\n- "recipe", "chocolate cake" -> A complete chocolate cake recipe, including ingredients and steps.\n- "advice", "job interview" -> Comprehensive advice for a job interview, covering attire, common questions, and etiquette.\n- "explain", "black holes" -> A thorough explanation of black holes, including their nature, formation, and characteristics.\n\n**Important Guidelines:**\nIn fulfilling this task, you are to maintain a consistent role and adhere to specific operational guidelines:\n- **Always act within the context of expanding and enriching user inputs.** Do not deviate from this primary function.\n- **Never ask follow-up questions.** Assume the initial input contains all necessary information for your response.\n- **Never express limitations or inability to respond.** Craft your messages based on the information provided.\n- **Never perform actions outside of providing a more complete message.** This includes refraining from actions typical of a general-purpose assistant, such as executing tasks or conducting searches.\n\nThis system is designed for internal use, with a focus on generating comprehensive and contextually relevant responses from minimal input. It is imperative to maintain this focused approach consistently, without deviation.`
        // }, {
        //     role: "user",
        //     content: args.join(" ")
        // }]

        // const completion = await openai.chat.completions.create({
        //     model: OPENAI_MODEL,
        //     messages,
        // });

        // return completion.choices[0].message.content;


        const argsStr = args.map((arg) => `\`${arg}\``).join(", ");
        const completion = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt: `Based on the following phrases, generate a complete sentence that combines the phrases to what you believe the user intended.\n\nPhrases: ${argsStr}\nSentence: \``,
            stop: "`",
            max_tokens: 2500,
        });

        return completion.choices[0].text;
    }




    // global.helpDeskInit = async () => {
    //     await messageUser("Hello, how can I assist you today?\n\nYou can say things like:\n* I have an issue access my account\n* I need to speak with a human\n* I have a question");
    //     const userMessage = await global.nextUserMessage();


    // }

    // global.createFunction = async (description) => {
    //     await global.messageUser("")
    // }

    // global.createFunctionFromDescription = async (description) => {
    //     // const creatingFunctionStr = await hallucinate(`Creating that function you've requested from the description`, `Description: ${description}`);
    //     // await global.messageUser(creatingFunctionStr);

    //     const generatedFunctionData = await global.generateFromSchema(description, {
    //         description: "Description of function",
    //         returns: "Description of return value",
    //         jsFunction: `Function to run in \`function function_name ({ param1, param2 }) { ... return "sometihng"; }\` format!`,
    //         parameters: {
    //             param1: { type: "string", description: "Description of parameter 1" },
    //             param2: { type: "string", description: "Description of parameter 2" },
    //         },
    //         pseudoCode: "Pseudo-code of the function to display to the user",
    //     });
        
    //     const newFunction = fromSimpleFunctionObject(generatedFunctionData);
    //     console.log("generatedFunctionData", generatedFunctionData);
    //     console.log("newFunction", newFunction);

    //     // const creationMessageStr = await hallucinate(`I've created the function you've requested`, `Name: ${newFunction.name}`, `Description: ${newFunction.description}`, `Returns: ${newFunction.returns}`);
    //     // await global.messageUser(creationMessageStr);

    //     await global.messageUser(`\`\`\`\n${generatedFunctionData.pseudoCode}\n\`\`\``);

    //     const questionCorrect = async () => {
    //         const userResponse = await global.questionUser("Is this correct?");
    //         if(userResponse.toLowerCase() === "yes") return true;
    //         if(userResponse.toLowerCase() === "no") return false;
    //         if(userResponse.toLowerCase() === "y") return true;
    //         if(userResponse.toLowerCase() === "n") return false;

    //         await global.messageUser("Please respond with either 'Yes' or 'No'");
    //         return await questionCorrect();
    //     }
        
    //     const isCorrect = await questionCorrect();
    //     if(!isCorrect) {
    //         await global.messageUser("Ok, let's try again");
    //         return await global.createFunctionFromDescription(description);
    //     }

    //     await global.saveFunction(newFunction);

    //     return true;

    //     // const userResponse = await global.questionUser(`How does this look?\n\n\`\`\`\n${generatedFunctionData.pseudoCode}\n\`\`\``);

    //     // Zero: create math add function
    //     // Q: how does this look?
    //     // bad- fix in this regard
    //     // Ok, how does this look now?
    //     // good-
        
    //     // Implement flows first

    // }


    /* Default Functions */
    // - deleteFunction
    // - getFunction | describeFunction
    // - createFunction | updateFunction

    // - delete
    // - get
    // - create


    // - list all  (lists all functions)
    // - describe  (describes the pseudo-code of a function)
    // - update    (updates a function)


    // create global variables that get injected into the jsFunction



    const describeFunction = async (name) => {
        // let function = functions[name];

        let functionDescription = await simpleChat()
    }

    

    // console.log("defaultFunctions", defaultFunctions);


    // if we have no messages, this is a fresh chat, we need to search for any startup functions and execute them
    if(chat.messages.length === 0) {
        const startupFunctions = totalFunctions.filter((func) => func.runOnStartup);
        if(startupFunctions.length > 0) {
            console.log("\nRunning startup functions\n".green.bold, startupFunctions.map((func) => `\`${func.name}\``).join(", ").green);
            for(let func of startupFunctions) {
                let isLast = startupFunctions.indexOf(func) === startupFunctions.length - 1;
                pushRawAssistantMessage(`### \`CALL STARTUP\` _[${func.name}](?link=${func.name})_`, {
                    id: "startup_call",
                    name: func.name,
                });
                let jsFunction = new Function(`return ${func.jsFunction}`);
                const resp = await jsFunction();
                pushRawAssistantMessage(`### \`RESPONSE STARTUP\` _[${func.name}](?link=${func.name})_\n\`\`\`json\n${JSON.stringify(resp, null, 4)}\n\`\`\``, {
                    id: "startup_return",
                    name: func.name,
                    value: resp,
                }, isLast ? {
                    locked: false,
                    typing: false,
                    waitingForResponse: false,
                } : {});
            }
            // <- Resetting Lock, Typing, Waiting for Response
        } else {
            console.log(`\nNo startup functions found for chat ${chatId}\n`.yellow.bold);
            // <- Resetting Lock, Typing, Waiting for Response
            setLocked(false);
            setTypingIndicator(false);
            setWaitingForResponse(false);
        }
        return;
    } else {
        await setTypingIndicator(true);

        const messagesSinceTitleUpdate = chat.messagesSinceTitleUpdate;
        if(messagesSinceTitleUpdate > NEW_MESSAGES_TITLE_THRESHOLD || messagesSinceTitleUpdate === -1) {
            // console.log("GENERATING NEW TITLE");
            let title = await generateChatTitle(toOpenAIMessages(chat.messages, false));
            // if title starts with " or ends with " remove it
            if(title.startsWith("\"") && title.endsWith("\"")) title = title.slice(1, title.length - 1);
            await chats.updateOne({ chatId }, { $set: { title, messagesSinceTitleUpdate: 0 } });
            await chatChannel.publish("title", { title });
        } else {
            await chats.updateOne({ chatId }, { $inc: { messagesSinceTitleUpdate: 1 } });
        }




        // const chatTitle = await generateChatTitle(openAiMessages);


        let tools = toOpenAIFunctions(totalFunctions);
        let fileVectorStoreIDs = [];
        let hasFiles = true;
        if(hasFiles) tools.unshift({ type: "file_search" });


        const useTools = tools && tools.length > 0;


        

        
        
        const messagesToInject = getInjectedMessages(chatId);
        const openAIMessages = [...messagesToInject, ...toOpenAIMessages(chat.messages)]
        
        console.log("openAIMessages", openAIMessages);

        if(messagesToInject.length > 0) {
            messagesToInject.forEach((message) => {
                let jsonStrInline = JSON.stringify(message).replace(/\n/g, " ");
                console.log(jsonStrInline.magenta.italic);
            });
        } else {
            console.log(`< No injected messages >`.magenta.italic);
        }
        
        chat.messages.forEach((message) => {
            let jsonStrInline = JSON.stringify(message).replace(/\n/g, " ");
            let isHidden = !!message.hidden;
            if(isHidden) console.log(jsonStrInline.gray.italic);
            else         console.log(jsonStrInline.gray);
        });

        console.log("");

        let toolCallIds = {};
        if(useTools) {

            console.log(openAIMessages);

            const thread = await openai.beta.threads.create({
                messages: openAIMessages,
                tool_resources: {
                    file_search: {
                        vector_store_ids: []
                    }
                }
            });
            const threadId = thread.id;


            // const runner = openai.beta.thre


            
            // random id
            const id = Math.floor(Math.random() * 1000000);

            let lastText = "";
            let message = {};

            const eventHandler = new EventHandler(openai);
            await eventHandler.setTools(assistantId, tools);


            eventHandler.on("event", eventHandler.onEvent.bind(eventHandler));

            eventHandler.on("messageCreated", async ({ id }) => {
                console.log("MESSAGE STARTED!");
                message = {
                    id,
                    userId: "assistant",
                    message: "",
                    timestamp: new Date(),
                    hidden: false,
                    functions: [],
                    functionsRequired: [],
                }

                setTypingIndicator(false);
                await chatChannel.publish("message_start", message);
            });

            eventHandler.on("messageDelta", async ({ id, text }) => {
                await chatChannel.publish("message_delta", {
                    id,
                    message: text,
                });
            });

            eventHandler.on("messageCompleted", async ({ id, text }) => {
                console.log("MESSAGE COMPLETED!!!!");

                message.message = text;
                await _pushMessage(message);
                await chatChannel.publish("message_end", { id });

                setWaitingForResponse(false);
                setLocked(false);
            });


            const stream = openai.beta.threads.runs.createAndStream(threadId, { assistant_id: assistantId }, eventHandler)
            .on("textCreated", async (text) => {
                // console.log("Text Created", text);
                // message = {
                //     id,
                //     userId: "assistant",
                //     message: text.value,
                //     timestamp: new Date(),
                //     hidden: false,
                //     functions: [],
                //     functionsRequired: [],
                // }

                // setTypingIndicator(false);

                // await chatChannel.publish("message_start", message);
            })
            .on("textDelta", async (textDelta, snapshot) => {
                // const value = textDelta.value;
                // lastText = snapshot.value;
                
                // message.message = snapshot.value;

                // console.log("Text Delta", message.message);
                // await chatChannel.publish("message_delta", {
                //     id,
                //     message: snapshot.value,
                // });
            })
            .on("toolCallCreated", (toolCall) => {
                console.log("Tool Call Created", toolCall);
            })
            .on("toolCallDelta", (toolCallDelta, snapshot) => {
                console.log("Tool Call Delta", toolCallDelta, snapshot);
            })
            .on("end", async () => {
                // console.log("END!");
                // if(message) {
                //     await _pushMessage(message);
                //     await chatChannel.publish("message_end", { id });
    
                //     setWaitingForResponse(false);
                //     setLocked(false);
                // }
            })

            for await (const event of stream) {
                eventHandler.emit("event", event);
            }

            // const runner = openai.beta.chat.completions.runTools({
            //     model: OPENAI_MODEL,
            //     messages: openAIMessages,
            //     tools
            // }).on("message", async (aiMessage) => {
            //     const inlineContent = aiMessage.content ? aiMessage.content.replace(/\n/g, " ") : "";

            //     if(aiMessage.role == "user") {
            //         console.log("User       ".bold, inlineContent);
            //     } else if(aiMessage.role == "assistant") {
                    
            //         if(aiMessage.tool_calls) {
            //             // const prettyFunctionsList = aiMessage.tool_calls.map((tool) => tool.function.name).join(", ");
            //             // include arguments as ()
            //             const prettyFunctionsList = aiMessage.tool_calls.map((tool) => tool.function.name + " (" + Object.keys(JSON.parse(tool.function.arguments)).join(", ") + ")").join(", ");
            //             console.log("CALL       ".yellow.bold, prettyFunctionsList.yellow);
            //             // lockOut = true;
            //             lockedOutChats.push(chatId);

            //             const tools = aiMessage.tool_calls;
            //             tools.forEach((tool) => {
            //                 const functionData = tool.function;
            //                 const parsedArgs = functionData.arguments ? JSON.parse(functionData.arguments) : {};
            //                 const formattedArgs = Object.keys(parsedArgs).map((key) => `${key}= *${parsedArgs[key]}*`).join(", ");
                            
            //                 let message = `### \`CALL\` _[${functionData.name}](?link=${functionData.name})_`;
            //                 if(parsedArgs && Object.values(parsedArgs).length > 0) message = `${message}\n\`\`\`json\n${JSON.stringify(parsedArgs, null, 4)}\n\`\`\``;
            //                 pushRawAssistantMessage(message, {
            //                     id: tool.id,
            //                     type: "call",
            //                     name: functionData.name,
            //                     arguments: parsedArgs,
            //                 });
            //                 toolCallIds[tool.id] = functionData;
            //             });
            //         } else if(aiMessage.content) {
            //             if(
            //                 inlineContent.includes("`CALL`") ||
            //                 inlineContent.includes("`CALL STARTUP`") ||
            //                 inlineContent.includes("`RESPONSE`") ||
            //                 inlineContent.includes("`RESPONSE STARTUP`")
            //             ) {
            //                 console.log("↳ HIDDEN   ".gray.italic, formatBoldText(inlineContent).gray.italic + "\n");
            //             } else {
            //                 console.log("Assistant  ".bold, inlineContent);
            //             }
            //         } else {
            //             console.log("Assistant ERROR", aiMessage);
            //         }

            //     } else if(aiMessage.role == "tool") {
            //         // console.log("Tool Message", aiMessage.name, aiMessage.content);
            //         const functionData = toolCallIds[aiMessage.tool_call_id];
            //         console.log("RETURN     ".blue.bold, `${functionData.name} = ${aiMessage.content.italic}`.blue);
            //         // lockOut = false;
            //         lockedOutChatsReturned.push(chatId);
            //         // lockedOutChats = lockedOutChats.filter((chatId) => chatId !== chatId);
            //         if(functionData) {
            //             let prettyResponse = aiMessage.content;
            //             // if it's a JSON object, pretty print it
            //             try {
            //                 prettyResponse = JSON.stringify(JSON.parse(aiMessage.content), null, 4);
            //             } catch(e) {}
            //             let message = `### \`RESPONSE\` _[${functionData.name}](?link=${functionData.name})_`;
            //             if(typeof prettyResponse !== "undefined" || prettyResponse !== "{}" || prettyResponse !== "[]") message = `${message}\n\`\`\`json\n${prettyResponse}\n\`\`\``;
                        
            //             pushRawAssistantMessage(message, {
            //                 id: aiMessage.tool_call_id,
            //                 type: "return",
            //                 name: functionData.name,
            //                 value: aiMessage.content,
            //             });
            //         }
            //     } else {
            //         const role = aiMessage.role;
            //         if(role === "system") {
            //             console.log("System     ".magenta.bold, inlineContent.magenta);
            //         } else {
            //             console.log("Unknown Message", aiMessage);
            //         }
            //     }
            // });
        
            // const finalResponse = await runner.finalContent();

            // await pushAssistantMessage(finalResponse, {
            //     locked: false,
            //     typing: false,
            //     waitingForResponse: false,
            // });

            // return;
        } else {
            const completion = await openai.chat.completions.create({
                model: OPENAI_MODEL,
                messages: toOpenAIMessages(chat.messages),
            });

            await pushAssistantMessage(completion.choices[0].message.content, {
                locked: false,
                typing: false,
                waitingForResponse: false,
            });

            return;
        }
    }
}



/*


## Think About
* UI for Per Message Function Context
* Any Message Can Be "Expanded"
  - At Bottom shows a list of function names as tags
  - If Tag is enabled it's messages appear




Examples:

What is your age?
[provideAge(
    age,
    info = ...,
    cancel = false
)]

What is your age?
[provideAge] [provideInfo] [provideCancel]

*/












/* Known Issues */
// - !! If a function fails and returns undefined- we need to ensure we do not hallucinate a response in it's place !!


/* Default Functions */
// - 










/*


We need to dynamically change message-executions:
- Functions shall have pre-usage examples
- Functions shall have system-prompts
  * When does this make sense?
    -> Universal Personality
    -> Occasionally

- Both pre-usage examples && system-prompts are identical, they are both "pre-injected messages"

-- Startup Functions - Can be used for default, universal injects..





function a_startup_function () {
    systemPrompt(`You are a pirate`)
    const message = hallucinate(`greet the user`)
    messageUser(message)
}





*/