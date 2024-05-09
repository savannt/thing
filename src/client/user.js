export default async function user() {
    const response = await fetch("/api/user", {});
    const data = await response.json();
    return data;
}