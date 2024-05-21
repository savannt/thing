import openai, { OPENAI_MODEL } from "../_OpenAI.js";
import Messages from "./Messages.js";

export const FINISH_REASONS = [
    "stop",
    "length",
    "function_call",
    "content_filter",
    "null",

    "tool_calls",
]

export class Choice {
    constructor (ownerObject, data) {
        this._init(ownerObject, data);
    }

    _init (ownerObject, data) {
        const { index, message, delta, logprobs, finish_reason } = data;

        if(ownerObject === "chat.completion") {}


        if(typeof index === "undefined") throw new Error("Index is required");
        if(finish_reason) {
            if(FINISH_REASONS.indexOf(finish_reason) === -1) throw new Error("Finish reason is invalid \`" + finish_reason + "\`");
        }
        // if(!finish_reason) throw new Error("Finish reason is required");
        // if(!message) throw new Error("Message is required");
        
        this.index = index;
        this.logprobs = logprobs;

        if(message) {
            this.message = message;
        } else if(delta) {
            this.delta = delta;
        }
    }

    static from (ownerObject, data) {
        return new Choice(ownerObject, data);
    }
}

export class ChatCompletionChunk {
    constructor (data) {
        this._init(data);
    }

    _init(data) {
        const { id, object, created, model, system_fingerprint, choices } = data;

        if(!id) throw new Error("ID is required");
        if(!object) throw new Error("Object is required");
        if(!created) throw new Error("Created is required");
        if(!model) throw new Error("Model is required");
        // if(!system_fingerprint) throw new Error("System fingerprint is required");
        if(!choices) throw new Error("Choices are required");

        this.id = id;
        this.object = object;
        this.created = created;
        this.model = model;
        this.system_fingerprint = system_fingerprint;

        this.choices = choices.map(choice => Choice.from(object, choice));
    }

    static from (data) {
        return new ChatCompletionChunk(data);
    }
}

import events from "events";

export default class ChatCompletion extends events.EventEmitter {

    constructor (data) {
        super();

        // this._init(data);
        this.json = false;
        this.choices = [];
    }

    _onChunk (chunk) {
        const choices = chunk.choices;
        // for each choice, if no string in this.choices[choices.index] then add it, then add the delta to the string
        for(let i = 0; i < choices.length; i++) {
            const choice = choices[i];

            const index = choice.index;
            const delta = choice.delta;
            
            
            if(delta) {
                
                if(typeof this.choices[index] === "undefined") {
                    this.emit("start", { index });   
                    this.choices[index] = delta;
                } else {
                    const recursiveObjectAdd = (obj, newObj) => {
                        for(const key in newObj) {
                            if(typeof obj[key] === "undefined") {
                                obj[key] = newObj[key];
                            } else if(typeof obj[key] === "string" && obj[key] !== newObj[key]) {
                                obj[key] += newObj[key];
                            } else if(Array.isArray(obj[key]) && Array.isArray(newObj[key])) {
                                for(let i = 0; i < newObj[key].length; i++) {
                                    if(typeof obj[key][i] === "undefined") {
                                        obj[key][i] = newObj[key][i];
                                    } else if(typeof obj[key][i] === "string" && obj[key][i] !== newObj[key][i]) {
                                        obj[key][i] += newObj[key][i];
                                    } else if(typeof obj[key][i] === "object") {
                                        recursiveObjectAdd(obj[key][i], newObj[key][i]);
                                    }
                                }
                            } else if(typeof obj[key] === "object") {
                                recursiveObjectAdd(obj[key], newObj[key]);
                            }
                        }
                    }
                    recursiveObjectAdd(this.choices[index], delta);

                    if(this.choices[index].content) {
                        this.emit("delta", this.choices[index]);
                    }
                }
                // if(delta.content) {
                //     this.choices[index].content += delta.content;
                //     this.emit("choice_delta", {
                //         index,
                //         delta: delta.content,
                //         content: this.choices[index].content
                //     });
                // }
            }

            if(!delta) {
                // console.log("no delta", choice);
            }


            // if delta is an empty object
            if(Object.keys(delta).length === 0) {

                if(this.choices[index].tool_calls) {
                    const toolCallls = this.choices[index].tool_calls;
                    // for each tool call emit a tool_call
                    for(let i = 0; i < toolCallls.length; i++) {
                        const functionData = toolCallls[i].function;
                        functionData.id = toolCallls[i].id;
                        this.emit("tool_call", { message: this.choices[index], toolCall: functionData });
                    }
                } else if(this.choices[index].content) {
                    let obj = {
                        index,
                        message: this.choices[index],
                    }

                    if(this.json) obj.json = JSON.parse(obj.message.content);
                    this.emit("end", obj);
                }
            }
            

            
            
            
            // if(delta && delta.content) {
            //     const deltaString = delta.content;
                



            //     if(typeof this.choices[index] === "undefined") {
            //         this.emit("choice_start", { index });   
            //         this.choices[index] = "";
            //     }
                
            //     this.choices[index] += deltaString;
            //     if(deltaString.length > 0) {
            //         this.emit("choice_delta", { index, delta: deltaString, content: this.choices[index] });   
            //     }
            // } else if(this.choices[index]) {
            //     this.emit("choice_end", { index, content: this.choices[index] });
            // }

        }
    }

    _init (data) {
        const { choices, created, id, model, object, usage } = data;

        if(!choices) throw new Error("Choices are required");
        if(!Array.isArray(choices)) throw new Error("Choices must be an array");
        if(choices.length === 0) throw new Error("Choices must have at least one item");
        if(!created) throw new Error("Created is required");
        if(!id) throw new Error("ID is required");
        if(!model) throw new Error("Model is required");
        if(!object) throw new Error("Object is required");
        if(!usage) throw new Error("Usage is required");

        this.firstChoice = choices[0];
        this.choices = choices;
        this.created = created;
        this.id = id;
        this.model = model;
        this.object = object;
        this.usage = usage;
    }

    static async createTools (messages, tools, toolChoice = "auto", model = OPENAI_MODEL, options = {}) {
        const { valid, reason } = tools.validate();
        if(!valid) throw new Error("Tools are invalid: " + reason);
        

        return await ChatCompletion.create(messages, model, {
            tools: tools.asArray(),
            tool_choice: toolChoice,

            ...options,
        });
    }

    static async createJsonFromSchema (schema, input, examples = [], model = OPENAI_MODEL, options = {}) {
        const messages = new Messages();
        messages.add("system", `**Please always generate a JSON object according to the following schema: **\n\`\`\`\n${JSON.stringify(schema, null, 2)}\n\`\`\`\n**Ensure that the JSON you generate follows the structure and types defined in this schema.**`)
        
        const inputDataPrefix = `input data: `;

        for(let i = 0; i < examples.length; i++) {
            const inExample = examples[i].in;
            const outExample = examples[i].out;
            if(!inExample) throw new Error("Example in is required");
            if(!outExample) throw new Error("Example out is required");

            messages.add("user", `${inputDataPrefix}\n\`\`\`\n${JSON.stringify(inExample)}\n\`\`\``)
            messages.add("assistant", JSON.stringify(outExample));
        }

        messages.add("user", `${inputDataPrefix}\n\`\`\`\n${JSON.stringify(input, null, 2)}\n\`\`\``)
        

        return await this.createJson(messages, model, options);
    }

    static async createJson (messages, model = OPENAI_MODEL, options = {}) {
        console.warn("[ChatCompletion] When using JSON mode, ensure that the messages instruct to output JSON");

        options["response_format"] = { "type": "json_object" };
        return await this.create(messages, model, options);
    }

    static async create (messages, model = OPENAI_MODEL, options = {}) {
        if(!messages) throw new Error("Messages are required");        
        if(!(messages instanceof Messages)) {
            if(!Array.isArray(messages)) throw new Error("Messages must be an array");
            messages = Messages.from(messages);
        }
        
        const { valid: messagesValid, reason: messagesInvalidReason } = messages.validate();
        if(!messagesValid) throw new Error("Messages are invalid: " + messagesInvalidReason);

        const _completionData = {
            messages: messages.asArray(),
            model,

            ...options,

            stream: true
        };

        const completion = await openai.chat.completions.create(_completionData);
        let chatCompletion = new ChatCompletion(completion);
        if(_completionData.response_format && _completionData.response_format.type === "json_object") chatCompletion.json = true;

        // for await (const chunk of completion) {
        //     chatCompletion._onChunk(
        //         ChatCompletionChunk.from(chunk)
        //     );
        // }

        // do the above, but not in this thread
        (async () => {
            for await (const chunk of completion) {
                chatCompletion._onChunk(
                    ChatCompletionChunk.from(chunk)
                );
            }
        })();

        return chatCompletion;
    }
}