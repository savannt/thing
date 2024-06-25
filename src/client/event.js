export default async function event(chatId = false, eventName, payload = {}, silent = false, speed = false) {
    if(!speed) {
        // try and get THING_KING_PLAYBACK_SPEED cookie
        const cookie = document.cookie.split(";").find(c => c.trim().startsWith("THING_KING_PLAYBACK_SPEED"));
        if(cookie) {
            const _speed = cookie.split("=")[1];
            if(_speed) {
                speed = parseFloat(_speed);
            }
        }

        if(!speed) speed = 5;
    }

    if(!chatId) throw new Error("Chat ID is required");

    // replace all `/` in eventName with _ to prevent path traversal
    eventName = eventName.replace(/\//g, "_");
    const response = await fetch(`/api/flow/event/${eventName}?chatId=${chatId}&silent=${silent}&speed=${speed}`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    if(response.status !== 200) return false;
    const data = await response.json();
    return data;
}

export async function onUserMessage (chatId, message, files, speed) {
    return await event(chatId, "Events/OnUserMessage", { chatId, message, files }, false, speed);
}

export async function onChatCreated (chatId) {
    return await event(chatId, "Events/OnChatCreated", {}, true);
}