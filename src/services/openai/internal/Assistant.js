import openai, { OPENAI_MODEL } from "../_OpenAI.js";

import Thread from "./Thread.js";
import EventHandler from "./EventHandler.js";

export default class Assistant {
    constructor (data) {
        this._init(data);
    }

    _init (data) {
        const { id, name, description, model, instructions, tools, tool_resources, metadata, response_format } = data;

        this.id = id;
        this.name = name;
        this.description = description;
        this.model = model;
        this.instructions = instructions;
        this.tools = tools;
        this.tool_resources = tool_resources;
        this.metadata = metadata;
        this.response_format = response_format;
    }

    async setTools (tools) {
        return await this.update({ tools });
    }

    async update (data) {
        const assistant = await openai.beta.assistants.update(this.id, { ...data });
        if(!assistant) throw new Error("Assistant not found");

        this._init(assistant);
        return this;
    }

    static async fromId (assistantId) {
        const assistant = await openai.beta.assistants.retrieve(assistantId);
        if(!assistant) throw new Error("Assistant not found");
        
        return new Assistant(assistant);
    }

    static async from (assistantObject) {
        if(!assistantObject) throw new Error("Assistant object is not defined");
        if(!assistantObject.id) throw new Error("Assistant object does not have an ID");
        return await Assistant.fromId(assistantObject.id);
    }

    static async create (name, instructions, model = OPENAI_MODEL, tools = []) {
        return await Assistant.from(
            await openai.beta.assistants.create({
                name,
                instructions,
                tools,
                model
            })
        );
    }

    async runThread (thread, onMessageCreated, onMessageDelta, onMessageCompleted) {
        if(!thread) throw new Error("Thread is not defined");
        if(!(thread instanceof Thread)) throw new Error("Thread must be an instance of the Thread class");

        if(!onMessageCreated) throw new Error("onMessageCreated is not defined");
        if(!onMessageDelta) throw new Error("onMessageDelta is not defined");
        if(!onMessageCompleted) throw new Error("onMessageCompleted is not defined");
        if(!(onMessageCreated instanceof Function)) throw new Error("onMessageCreated must be a function");
        if(!(onMessageDelta instanceof Function)) throw new Error("onMessageDelta must be a function");
        if(!(onMessageCompleted instanceof Function)) throw new Error("onMessageCompleted must be a function");


        const eventHandler = new EventHandler();

        eventHandler.on("messageCreated", async ({ id }) => {
            onMessageCreated(id);
        });

        eventHandler.on("messageDelta", async ({ id, text }) => {
            onMessageDelta(id, text);
        });

        eventHandler.on("messageCompleted", async ({ id, text }) => {
            onMessageCompleted(id, text);
        });

        const run = openai.beta.threads.runs.createAndStream(thread.id, {
            assistant_id: this.id
        }, eventHandler);

        for await (const event of run) {
            await eventHandler.onEvent(event);
        }

        return run;
    }
}