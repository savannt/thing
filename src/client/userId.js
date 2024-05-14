export default async function getUserId () {
    try {
        const response = await fetch("/api/auth/init");
        const data = await response.json();
        if(!data.userId) return false;
        return data.userId;
    } catch (err) { return false; }
}
