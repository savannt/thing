import { useEffect } from "react";

export default function extension () {
    useEffect(() => {
        // open "/extension/releases/thing_king_chrome_extension_latest.zip" in new tab
        window.open("/extension/releases/thing_king_chrome_extension_latest.zip", "_blank");
        // redirect to "/"
        window.location.href = "/?extension_downloaded=true";
    });
    
    return null;
}