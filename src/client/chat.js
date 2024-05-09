export default async function chat(chatId, enterpriseId = false, operation = false, options = {}) {
    let url = "/api/chat/" + chatId + (operation ? "/" + operation : "");
    if(enterpriseId && url.indexOf("?") === -1) url += "?enterpriseId=" + enterpriseId;
    else if(enterpriseId) url += "&enterpriseId=" + enterpriseId;
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
}

export async function chatNew (enterpriseId = false) {
    return await chat("new", enterpriseId);
}

export async function getChat (chatId, enterpriseId, groupId) {
    let url = chatId;
    if(enterpriseId && groupId) enterpriseId = enterpriseId + "&groupId=" + groupId;
    else if(groupId) url += "?groupId=" + groupId;
    return await chat(url, enterpriseId);
}

export async function chatDelete (chatId) {
    return await chat(chatId, false, "delete");
}

export async function chatMessage (chatId, enterpriseId, message, files = []) {
    return await chat(chatId, enterpriseId, "message", {
        method: "POST",
        body: JSON.stringify({ message, files }),
    });
}