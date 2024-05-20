export const ROLES = ["user", "assistant", "system", "tool"];

export default class Message {
    constructor (data) {
        this._init(data);
    }

    _init (data) {
        const {
            role,
            content,
            tool_calls,
            tool_call_id,
            attachments
        } = data;

        if(ROLES.indexOf(role) === -1) throw new Error("Role must be either 'user' or 'assistant'");
        // if(!content) throw new Error("Content is required");

        this.role = role;
        this.content = content;
        this.tool_calls = tool_calls;
        this.tool_call_id = tool_call_id;
        this.attachments = attachments;
    }

    asJSON () {
        let message = {
            role: this.role,
            content: this.content || null,
        };
        if(this.tool_calls) message.tool_calls = this.tool_calls;
        if(this.tool_call_id) message.tool_call_id = this.tool_call_id;
        if(this.attachments) message.attachments = this.attachments;
        
        return message;
    }

    static from (messageData, skipValidation = false) {
        if(!skipValidation) {
            const { valid, reason } = Message.validate(messageData);
            if(!valid) throw new Error(`Invalid message: ${reason}`);
        }
        
        return new Message(messageData);
    }

    static validate (message) {
        const { role, content, attachments } = message;

        if(!role) return { valid: false, reason: "Role is required" };
        if(ROLES.indexOf(role) === -1) return { valid: false, reason: "Role is invalid" };
        // if(!content) return { valid: false, reason: "Content is required" };
        if(content && typeof content !== "string") return { valid: false, reason: "Content must be a string" };

        return { valid: true, reason: null };
    }
}