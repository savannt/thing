import { createContext, useState, useEffect, useContext } from "react";

export const SidebarCollapsedContext = createContext(0);

export default function SidebarCollapsedProvider ({ children }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        const handleStorageChange = () => {
            if(window.localStorage.getItem("sidebar_collapsed")) {
                const value = window.localStorage.getItem("sidebar_collapsed");
                setIsSidebarCollapsed(value === "true");
            }
        };
    
        if(window) window.addEventListener("storage", handleStorageChange);
    
        // Return a cleanup function to remove the event listener
        return () => {
            if(window) {
                window.removeEventListener("storage", handleStorageChange);
            }
        };
    }, []); 

    return (
        <SidebarCollapsedContext.Provider value={isSidebarCollapsed}>
            { children }
        </SidebarCollapsedContext.Provider>
    )
}