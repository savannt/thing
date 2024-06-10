import notification from "@/client/notification"

export default function toggleTheme () {
    const THEMES = [
        "light",
        "gray",
        "dark",
        "black",
    ]

    // let newTheme = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";




    // get current theme and find its index in the THEMES array, using that find the next index- restart if last
    let currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    let currentIndex = THEMES.indexOf(currentTheme);
    let nextIndex = currentIndex + 1;
    if(nextIndex >= THEMES.length) nextIndex = 0;
    let newTheme = THEMES[nextIndex];

    document.documentElement.setAttribute("data-theme", newTheme);
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if(metaThemeColor) metaThemeColor.setAttribute("content", getComputedStyle(document.documentElement).getPropertyValue("--background-color"));

    // capitalize first letter of newTheme
    let newThemeCapitalized = newTheme.charAt(0).toUpperCase() + newTheme.slice(1);
    notification("", `Themed changed to ${newThemeCapitalized}`, "var(--active-color)");
}