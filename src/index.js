import { Assistant, Thread, Message } from "./openai/OpenAI.js";

Assistant.create("An AI Assistant", "An AI Assistant that can help you with your tasks.").then(assistant => {
    Thread.create().then(thread => {
        thread.addMessage(
            new Message({
                role: "user",
                content: "Hello, how are you?"
            })
        ).then(thread => {
            assistant.runThread(thread, () => {}, (id, text) => {
                console.log("messageDelta", id, text);
            }, (id, text) => {
                console.log("messageCompleted", id, text);
            }).then(ran => {
            });
        });
    });
});