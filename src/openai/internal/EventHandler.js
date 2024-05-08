import openai from "../_OpenAI.js";
import events from "events";

export default class EventHandler extends events.EventEmitter {
    constructor() {
        super();

        this.tools = [];
        this.messages = {};
    }

    async setTools (assistantId, tools) {
        await setTools(assistantId, tools);
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
            const stream = openai.beta.threads.runs.submitToolOutputsStream(threadId, runId, { tool_outputs: toolOutputs });
            for await (const event of stream) {
                this.emit("event", event);
            }
        } catch (error) {
            console.error("Error in submitToolOutputs", error);
        }
    }
}