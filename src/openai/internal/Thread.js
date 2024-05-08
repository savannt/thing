import openai from "../_OpenAI.js";

import Message from "./Message.js";

export default class Thread {
    constructor (data) {
        this._init(data);
    }

    _init (data) {
        const { id, created_at, metadata, tool_resources } = data;

        this.id = id;
        this.messages = []; // TODO: Initialize messages.list()
        this.created_at = created_at;
        this.metadata = metadata;
        this.tool_resources = tool_resources;
    }

    async addMessage (message) {
        if(!message) throw new Error("Message is not defined");
        if(!(message instanceof Message)) throw new Error("Message must be an instance of the Message class");

        const messageResponse = await openai.beta.threads.messages.create(this.id, message.asJSON());
        if(!messageResponse) throw new Error("Message not found");

        this.messages.push(messageResponse);
        return this;
    }

    async update (data) {
        const thread = await openai.beta.threads.update(this.id, { ...data });
        if(!thread) throw new Error("Thread not found");

        this._init(thread);
        return this;
    }

    static async fromId (threadId) {
        const thread = await openai.beta.threads.retrieve(threadId);
        if(!thread) throw new Error("Thread not found");

        return new Thread(thread);
    }

    static async from (threadObject) {
        if(!threadObject) throw new Error("Thread object is not defined");
        if(!threadObject.id) throw new Error("Thread object does not have an ID");
        return await Thread.fromId(threadObject.id);
    }

    static async create () {
        return await Thread.from(
            await openai.beta.threads.create()
        );
    }
}