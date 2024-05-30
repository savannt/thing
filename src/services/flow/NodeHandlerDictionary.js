import ably from "@/services/ably";

export default {
    "StringConstant": function String ({ value }) {
        return { value }
    },
    "NumberConstant": function Number ({ value }) {
        return { value }
    },
    "TextareaStringConstant": function TextareaString ({ value }) {
        return { value }
    },
    "SaveMessage": function SaveMessage ({ message }) {
        return { message };
    },
    "OnUserMessage": function OnUserMessage ({ message, chatId }) {
        return { message, chatId };
    },
    "OnChatCreated": function OnChatCreated({ chatId }) {
        return { chatId };
    },
    "Array/Combine": function ArrayCombine ({ arrayA, arrayB }) {
        return { combined: arrayA.concat(arrayB) };
    },
    "Array/Push": function ArrayPush ({ array, value }) {
        array.push(value);
        return { array };
    },
    "Array/Splice": function ArraySplice ({ array, start, deleteCount, items }) {
        array.splice(start, deleteCount, ...items);
        return { array };
    },
    "Array/Length": function ArrayLength ({ array }) {
        return { length: array.length };
    },
    "Array/Filter": function ArrayFilter ({ array, condition }) {
        return { array: array.filter(condition) };
    },
    "Array/Map": function ArrayMap ({ array, transformation }) {
        return { array: array.map(transformation) };
    },
    "Math/Add": function MathAdd ({ a, b }) {
        return { result: a + b };
    },
    "Math/Subtract": function MathSubtract ({ a, b }) {
        return { result: a - b };
    },
    "Math/Multiply": function MathMultiply ({ a, b }) {
        return { result: a * b };
    },
    "Math/Divide": function MathDivide ({ a, b }) {
        return { result: a / b };
    },
    "JSON/Parse": function JSONParse ({ jsonString }) {
        return { object: JSON.parse(jsonString) };
    },
    "JSON/Stringify": function JSONStringify ({ object }) {
        return { jsonString: JSON.stringify(object) };
    },

    "Messages/Push": function MessagesAdd ({ messages, message }) {

    },
    "Messages/Combine": function MessagesCombine ({ messagesA, messagesB }) {

    },

    "Message/Construct": function MessageConstruct ({ text, author }) {

    },
    "Message/GetText": function MessageGetText ({ message }) {
        console.log("[GetText] message", message);
        
        return { text: message.content || message.message || "" };
    },
    "Message/GetAuthor": function MessageGetAuthor ({ message }) {
        
    },
    "Message/GetTimestamp": function MessageGetTimestamp ({ message }) {

    },
    "Message/SetText": function MessageSetText ({ message, text }) {

    },
    "Message/SetAuthor": function MessageSetAuthor ({ message, author }) {

    },

    "ChatCompletion/Create": async function ChatCompletionCreate ({ messages }) {

    },
    "ChatCompletion/CreateWithTools": async function ChatCompletionCreateWithTools ({ messages, tools, toolChoice }) {

    },
    "ChatCompletion/CreateFromTemplate": async function ChatCompletionCreateFromTemplate ({ template, input, examples }) {

    },

    "Assistant/Create": async function AssistantCreate ({ name, instructions, tools }) {

    },
    "Assistant/GetFromId": async function AssistantGetFromId ({ assistantId }) {

    },
    "Assistant/Update": async function AssistantUpdate ({ assistant, data }) {

    },
    "Assistant/SetTools": async function AssistantSetTools ({ assistant, tools }) {

    },

    "Tools/CreateEmpty": function ToolsCreateEmpty () {

    },
    "Tools/Add": function ToolsAdd ({ tools, tool }) {

    },


    "Utility/End": function UtilityEnd () {},

    "Utility/PlayNotification": function UtilityPlayNotification ({ title, content }) {
        console.log("[Utility/PlayNotification] Playing notification", title, content);

        const channel = ably.channels.get("notifications");
        channel.publish("notification", { title, content });
    }
}