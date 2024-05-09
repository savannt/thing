export default async function groups(enterpriseId = false, limit = 10, title = null) {
    let url = "/api/groups";
    if(enterpriseId) {
        url += "?enterpriseId=" + enterpriseId;
        if(limit) url += "&limit=" + limit;
        if(title) url += "&title=" + title;
    }
    else {
        if(title) url += "?title=" + title + "&limit=" + limit;
        else url += "?limit=" + limit;
    }
    const response = await fetch(url, {});
    if(response.status !== 200) return false;
    const data = await response.json();
    return data;
}