import Message from "./Message.js";

export default class Messages {
    constructor () {
        this.messages = [];

    }
    
    addRaw (messageObject) {
        this.messages.push(Message.from(messageObject));
    }

    add (role, content) {
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
        return this.messages.map(message => message.asJSON());
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
}