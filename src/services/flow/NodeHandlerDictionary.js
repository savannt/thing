import ably from "@/services/ably";
import mongo from "@/services/mongodb";

import Event from "@/services/flow/Event";

import { ChatCompletion, Assistant, Messages, Message, Tools, Tool } from "@/services/openai/OpenAI";


// TODO: Verify input and output types-
// let's ideally create some "master parser" object which has validators for each type

const error = (title, ...messages) => {
	return {
		error: {
			title,
			messages
		}
	}
}


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
	"SaveMessage": async function SaveMessage ({ message, chatId }) {
		const { db } = await mongo();
        const chats = db.collection("chats");

        const chat = await chats.findOne({ chatId });
        if(!chat) return error("Chat not found", chatId);

        await chats.updateOne({ chatId }, {
            $push: {
                messages: message
            }
        });

		const chatChannel = ably.channels.get(`chat-${chatId}`);
		chatChannel.publish("message", { message });
        
        return {};
	},
	"SaveMessageStream": async function SaveMessageStream ({ message, messageId, chatId }) {
		const { db } = await mongo();
		const chats = db.collection("chats");

		const chat = await chats.findOne({ chatId });
		if(!chat) return error("Chat not found", chatId);

		// if chat.messages has not an object with messageId === messageId
		// then push message to chat.messages
		// otherwise, only update the "content" of the message
		message.messageId = messageId;
		const messageIndex = chat.messages.findIndex(m => m.messageId === messageId);
		if(messageIndex === -1) {
			await chats.updateOne({ chatId }, {
				$push: {
					messages: message
				}
			});
		} else {
			await chats.updateOne({ chatId }, {
				$set: {
					[`messages.${messageIndex}.content`]: message.content
				}
			});
		}

		const chatChannel = ably.channels.get(`chat-${chatId}`);
		chatChannel.publish("message", { message });
		
		return {};
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

	"Messages/CreateEmpty": function MessagesCreateEmpty () {
		return Messages.empty();
	},

	"Messages/Push": function MessagesPush ({ messages, message }) {
		// if messages is not instanceof Messages
		if(Array.isArray(messages)) messages = Messages.from(messages);
		if(!messages instanceof Messages) return error("Messages is not an instance of Messages");
		if(!message instanceof Message) return error("Message is not an instance of Message");

		messages.add(message);

		return { messages }
	},
	"Messages/Combine": function MessagesCombine ({ messagesA, messagesB }) {
        return { messages: Messages.combine(messagesA, messagesB) }
	},

	"Message/Construct": function MessageConstruct ({ text, author }) {
        return { message: Message.from({ content: text, role: author }) }
	},
	"Message/GetText": function MessageGetText ({ message }) {
		console.log("[GetText] message", message);
		
		return { text: message.content || message.message || "" };
	},
	"Message/GetAuthor": function MessageGetAuthor ({ message }) {
        return { author: message.role || "" }
	},
	"Message/GetTimestamp": function MessageGetTimestamp ({ message }) {
        return error("Not implemented");
	},
	"Message/SetText": function MessageSetText ({ message, text }) {
        message.content = text;
        return { message };
	},
	"Message/SetAuthor": function MessageSetAuthor ({ message, author }) {
        message.role = author;
        return { message };
	},


	
	"ChatCompletion/Create": async function ChatCompletionCreate ({ messages }) {
		return {
            run: await ChatCompletion.create(messages)
        }
	},
	"ChatCompletion/CreateWithTools": async function ChatCompletionCreateWithTools ({ messages, tools }) {
        return {
            run: await ChatCompletion.createTools(messages, tools)
        }
	},
	"ChatCompletion/CreateFromTemplate": async function ChatCompletionCreateFromTemplate ({ template, input, examples }) {

	},

	"Run/OnMessage": async function RunOnMessage ({ run }) {
		const onMessageEvent = new Event("onMessageEvent");
		
		if(run.choices && run.choices.length > 0) {
			await onMessageEvent.handle({
				message: run.choices[0],
				index: 0,
			});
		}
		run.on("end", async ({ index, message }) => {
			await onMessageEvent.handle({
				message,
				index
			});
		});
		return { onMessageEvent }
	},

	"Run/OnMessageStream": async function RunOnMessageStream ({ run }) {
		const onMessageStreamEvent = new Event("onMessageStreamEvent");
		const messageId = Math.random().toString(36).substring(7);
		run.on("delta", async (message) => {
			
			
			await onMessageStreamEvent.handle({
				message,
				messageId
			});
		});

		return { onMessageStreamEvent }
	},

	"Assistant/Create": async function AssistantCreate ({ name, instructions, tools }) {
        return {
            assistant: await Assistant.create(name, instructions, tools)
        }
	},
	"Assistant/GetFromId": async function AssistantGetFromId ({ assistantId }) {
        return {
            assistant: await Assistant.fromId(assistantId)
        }
	},
	"Assistant/Update": async function AssistantUpdate ({ assistant, data }) {
        await assistant.update(data);
        return {};
	},
	"Assistant/SetTools": async function AssistantSetTools ({ assistant, tools }) {
        await assistant.setTools(tools);
        return {};
	},

	"Tools/CreateEmpty": function ToolsCreateEmpty () {
        return Tools.empty();
	},
	"Tools/Add": function ToolsAdd ({ tools, tool }) {
        tools.add(tool);
        return { tools };
	},


	"Utility/End": function UtilityEnd () {},

	"Utility/PlayNotification": function UtilityPlayNotification ({ title, content }) {
		console.log("[Utility/PlayNotification] Playing notification", title, content);

		const channel = ably.channels.get("notifications");
		channel.publish("notification", { title, content });

		return {};
	}
}