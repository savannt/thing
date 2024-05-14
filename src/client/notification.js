export const DEFAULT_COLOR = "var(--active-color)";

export default async function notification (title, description = "", color = DEFAULT_COLOR) {
    if(window && window.location) {
        if(description === "" && color === DEFAULT_COLOR) {
            description = title;
            title = "";
        }
        const dataStr = JSON.stringify({ title, description, color });
        localStorage.setItem("notification", dataStr);
        console.log("[ERROR] [Safe] Set notification in localStorage", dataStr);
        console.log(localStorage, localStorage.getItem("notification"));
        window.dispatchEvent(new Event("storage"));
    }
}