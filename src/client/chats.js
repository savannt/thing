export default async function chats(enterpriseId = false, limit = 10, groupId = null) {
    let url = "/api/chats";
    if(enterpriseId) {
        url += "?enterpriseId=" + enterpriseId;
        if(limit) url += "&limit=" + limit;
        if(groupId) url += "&groupId=" + groupId;
    } else {
        url += "?limit=" + limit;
        if(groupId) url += "&groupId=" + groupId;
    }
    const response = await fetch(url, {});
    if(response.status !== 200) return false;
    const data = await response.json();
    return data;
}