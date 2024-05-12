import "animate.css";
import styles from "@/app/Header/Header.module.css";

import Logo from "@/app/Header/Logo";
import SquareButton from "@/components/Button/SquareButton";


import useMobile from "@/providers/Mobile/useMobile";
import useSidebarCollapsed from "@/providers/SidebarCollapsed/useSidebarCollapsed";

export default function Header ({ group, chat, onBack, onHome, onLogout }) {
    const isMobile = useMobile();
    const isSidebarCollapsed = useSidebarCollapsed();

    console.log("isSidebarCollapsed", isSidebarCollapsed, isMobile);

    let doShowLogo = !group;
    if(isMobile && isSidebarCollapsed) doShowLogo = false;

    return (
        <div id="header" className={styles.Header}>
            <div id="header-start" className={styles.Header__Start}>
                { group && <>
                    <SquareButton image="/images/icons/caret/caret_left.svg" onClick={() => onBack()} />
                    <h2>{group.title}</h2>
                </> }

                { doShowLogo && <Logo className={`animate__animated animate__fadeIn`} onClick={() => onHome()}/> }
            </div>
            <div className={styles.Header__End}>
                <SquareButton id="mobile-toggle-sidebar" image="/images/icons/sidebar.png" onClick={() => {
                    document.getElementById("toggle-sidebar").click();
                }} />
                <SquareButton id="toggle-theme" image="/images/icons/ic_theme.svg" onClick={() => {
                    // toggle data-theme from light to dark
                    document.documentElement.setAttribute("data-theme", document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light")
                }}/>
                <SquareButton id="logout" image="/images/icons/logout.svg" color="var(--red)" onClick={() => onLogout()}/>
            </div>
        </div>
    )
}