export default async function updateUserSettings(settings, options = {}) {
    let url = "/api/updateUserSettings";
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
        ...options,
    });
    const data = await response.json();
    return data;
}