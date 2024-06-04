import Message from "./Message.js";

export default class Messages {
    constructor () {
        this.messages = [];
        this._class = "Messages";
    }
    
    addRaw (messageObject) {
        this.messages.push(Message.from(messageObject));
    }

    add (role, content) {
        // if role is instanceof Message,
        if(role.role && role.content) {
            this.messages.push(role);
            return;
        }

        this.messages.push(
            Message.from({
                role,
                content
            })
        );
    }

    addToolCall (toolCallMessage) {
        this.messages.push(Message.from(toolCallMessage));
    }

    addToolCallResponse (toolCall, responseValue) {
        this.messages.push(
            Message.from({
                tool_call_id: toolCall.id,
                role: "tool",
                name: toolCall.name,
                content: typeof responseValue !== "string" ? JSON.stringify(responseValue) : responseValue
            })
        );
    }

    asArray () {
        return this.messages.map(message => message.asJSON ? message.asJSON() : message);
    }

    validate () {
        return Messages.validate(this.messages);
    }

    from (messagesArray) {
        if(!messagesArray) throw new Error("Messages array is required");
        if(!Array.isArray(messagesArray)) throw new Error("Messages must be an array");

        const { valid, reason } = Messages.validate(messagesArray);
        if(!valid) throw new Error(`Messages are not valid: ${reason}`);

        this.messages = messagesArray.map(message => Message.from(message, true));
    }
    
    static combine (messagesA, messagesB) {
        const messages = new Messages();
        messagesA.messages.forEach(message => messages.add(message));
        messagesB.messages.forEach(message => messages.add(message));
        return messages;
    }

    static from (messagesArray) {
        const messages = new Messages();
        messages.from(messagesArray);
        return messages;
    }

    static validate (messagesArray) {
        if(!messagesArray) return { valid: false, reason: "Messages array is required" };
        if(!Array.isArray(messagesArray)) return { valid: false, reason: "Messages must be an array" };

        for(let i = 0; i < messagesArray.length; i++) {
            const message = messagesArray[i];
            const { valid, reason } = Message.validate(message);
            if(!valid) return { valid, reason: `Message at index ${i} is invalid: ${reason}` };
        }

        return { valid: true, reason: null };
    }

    static empty () {
        return new Messages();
    }
}