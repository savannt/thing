process.env.OPENAI_API_KEY = "sk-1234567890abcdef1234567890abcdef";
import { ChatCompletion, Messages, Tools, Tool } from "../OpenAI.js"

(async () => {

    let aboutMeTool = Tool.createFromJsFn(
        function about_me () {
            return [
                "#1 I am a pirate",
                "#2 I like to sail the seven seas",
                "#3 I have a parrot named Polly",
                "#4 I have a wooden leg",
            ]
        }
    )


    let tools = new Tools();
    tools.add(aboutMeTool);


    let messages = new Messages();
    messages.add("system", "always speak like you are incredibly sweedish");
    messages.add("user",   "Hello, how are you?");
    messages.add("user",   "tell me about yourself");



    const chatComplete = async () => {
        console.log("MESSAGES", messages.asArray());
        const chatCompletion = await ChatCompletion.createTools(messages, tools);
    
        chatCompletion.on("tool_call", async ({ message, toolCall }) => {
            messages.addToolCall(message);
            let response = await tools.handleExecution(toolCall.name, toolCall.args);
            messages.addToolCallResponse(toolCall, response);
    
            chatComplete();
        });
    
        chatCompletion.on("start", (obj) => {
            console.log("starting", obj);
        });
        chatCompletion.on("delta", (obj) => { 
            // console.log("delta", obj);
        });
        chatCompletion.on("end", (obj) => {
            console.log("end", obj);
        });
    }
    await chatComplete();


    // console.log("completion", chatCompletion);
})();