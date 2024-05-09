export default async function group(groupId, operation = false, enterpriseId = false, title = false, options = {}) {
    let url = "/api/group/" + groupId;
    if(operation) url += "/" + operation;
    if(title) {
        url += "?title=" + title;
        if(enterpriseId) url += "&enterpriseId=" + enterpriseId;
    } else if(enterpriseId) {
        url += "?enterpriseId=" + enterpriseId;
    }
    const response = await fetch(url, {});
    const data = await response.json();
    return data;
}

export async function groupNew (enterpriseId = false, title = false) {
    return await group("new", false, enterpriseId, title);
}

export async function getGroup (groupId) {
    return await group(groupId);
}

export async function groupDelete (groupId) {
    return await group(groupId, "delete");
}