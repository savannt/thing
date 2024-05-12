import "animate.css";
import styles from "@/app/Header/Header.module.css";

import Logo from "@/app/Header/Logo";
import SquareButton from "@/components/Button/SquareButton";


import useMobile from "@/providers/Mobile/useMobile";
import useSidebarCollapsed from "@/providers/SidebarCollapsed/useSidebarCollapsed";
import { useEffect, useState } from "react";

export default function Header ({ group, chat, onBack, onHome, onLogout }) {
    const isMobile = useMobile();
    const {
        collapsed: isSidebarCollapsed,
        collapsing: isSidebarCollapsing
    } = useSidebarCollapsed();


    let doShowLogo = true;
    if(isMobile && (isSidebarCollapsed || isSidebarCollapsing) ) doShowLogo = false;

    let showActions = !(isMobile && isSidebarCollapsing);
    const [previousShowActions, setPreviousShowActions] = useState(showActions);
    const [logoAnimation, setLogoAnimation] = useState("");
    const [hideActions, setHideActions] = useState(false);
    const [actionsAnimation, setActionsAnimation] = useState("");
    useEffect(() => {
        // showActions ? "animate__fadeInLeft" : "animate__fadeOutLeft"

        if(showActions !== previousShowActions) {
            if(showActions) {
                setHideActions(false);
                setActionsAnimation("animate__fadeInLeft");
                setLogoAnimation("animate__fadeInLeft");
                setPreviousShowActions(showActions);
            } else {
                setActionsAnimation("animate__fadeOutLeft");
                setLogoAnimation("animate__fadeOutLeft");
                setPreviousShowActions(showActions);
            }
        }
        console.log("showActions", showActions, "prev" + previousShowActions);
    }, [showActions]);


    return (
        <div id="header" className={styles.Header}>
            <div id="header-start" className={styles.Header__Start}>
                {/* { !isSidebarCollapsed && group && <>
                    <SquareButton image="/images/icons/caret/caret_left.svg" onClick={() => onBack()} />
                    <h2>{group.title}</h2>
                </> } */}

                { doShowLogo ? <Logo className={`animate__animate ${logoAnimation}`} onClick={() => onHome()} onAnimationEnd={() => {
                    setLogoAnimation("");
                }} /> : <h3 className={`animate__animated animate__fadeInRight`} onClick={() => onHome()}>Chat</h3> }
            </div>
            <div className={styles.Header__End}>
                <div className={`animate__animated ${actionsAnimation}`} onAnimationEnd={() => {
                    if(actionsAnimation === "animate__fadeOutLeft") {
                        setHideActions(true);
                    } else {
                        setHideActions(false);
                    }
                    setActionsAnimation("");
                }} style={{
                    display: hideActions ? "none" : "flex"
                }}>
                    <SquareButton id="logout" image="/images/icons/logout.svg" color="var(--red)" onClick={() => onLogout()}/>
                    <SquareButton id="toggle-theme" image="/images/icons/ic_theme.svg" onClick={() => {
                        // toggle data-theme from light to dark
                        document.documentElement.setAttribute("data-theme", document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light")
                    }}/>
                </div>

                <SquareButton id="mobile-toggle-sidebar" image="/images/icons/sidebar.png" onClick={() => {
                    document.getElementById("toggle-sidebar").click();
                }} />
            </div>
        </div>
    )
}