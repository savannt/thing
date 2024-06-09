import notification from "@/client/notification"

export default async function downloadExtension(showNotification = true) {
    const url = "/extension/releases/thing_king_chrome_extension_latest.zip";
    const response = await fetch(url, {});
    const blob = await response.blob();
    const _url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href(_url);
    a.download = "thing_king_chrome_extension_latest.zip";
    a.click();
    if(showNotification) {
        notification("Extension downloaded", "Install via Chrome > Extension > Load Unpacked")
    }
}