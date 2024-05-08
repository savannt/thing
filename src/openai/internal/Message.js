import openai from "../_OpenAI.js";

export default class Message {
    constructor (data) {
        this._init(data);
    }

    _init (data) {
        const { role, content, attachments } = data;

        if(["user", "assistatnt"].indexOf(role) === -1) throw new Error("Role must be either 'user' or 'assistant'");
        if(!content) throw new Error("Content is required");

        this.role = role;
        this.content = content;
        if(attachments) this.attachments = attachments;
    }

    asJSON () {
        return {
            role: this.role,
            content: this.content,
            attachments: this.attachments
        };
    }
}