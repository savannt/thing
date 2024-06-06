export default async function event(chatId = false, eventName, payload = {}, silent = false) {
    if(!chatId) throw new Error("Chat ID is required");
    const response = await fetch(`/api/event/${eventName}?chatId=${chatId}&silent=${silent}`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    if(response.status !== 200) return false;
    const data = await response.json();
    return data;
}

export async function onUserMessage (chatId, message, files) {
    return await event(chatId, "OnUserMessage", { chatId, message, files });
}

export async function onChatCreated (chatId) {
    return await event(chatId, "OnChatCreated", {}, true);
}