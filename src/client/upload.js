export default async function upload (file, options = {}) {
    let formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
        ...options
    });
    const data = await response.json();
    return data;
}