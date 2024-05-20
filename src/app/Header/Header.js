import "animate.css";
import styles from "@/app/Header/Header.module.css";

import Logo from "@/app/Header/Logo";
import SquareButton from "@/components/Button/SquareButton";


import useMobile from "@/providers/Mobile/useMobile";
import useSidebarCollapsed from "@/providers/SidebarCollapsed/useSidebarCollapsed";
import { useEffect, useState } from "react";
import toggleTheme from "@/client/toggleTheme";

export default function Header ({ group, chat, onBack, onHome, onLogout, onChatDelete }) {
    const isMobile = useMobile();
    const {
        collapsed: isSidebarCollapsed,
        collapsing: isSidebarCollapsing
    } = useSidebarCollapsed();


    let doShowLogo = true;
    if(isMobile && (isSidebarCollapsed || isSidebarCollapsing) ) doShowLogo = false;
    if(!isMobile && group) doShowLogo = false;

    let showActions = !(isMobile && isSidebarCollapsing);
    const [previousShowActions, setPreviousShowActions] = useState(showActions);
    const [logoAnimation, setLogoAnimation] = useState("");
    const [groupAnimation, setGroupAnimation] = useState("");
    const [hideActions, setHideActions] = useState(false);
    const [actionsAnimation, setActionsAnimation] = useState("");
    const [invertedActionsAnimation, setInvertedActionsAnimation] = useState("");
    useEffect(() => {
        // showActions ? "animate__fadeInLeft" : "animate__fadeOutLeft"

        if(showActions !== previousShowActions) {
            if(showActions) {
                setHideActions(false);
                setActionsAnimation("animate__fadeInLeft");
                setInvertedActionsAnimation("animate__fadeOutRight");
                setLogoAnimation("animate__fadeInLeft");
                setGroupAnimation("animate__fadeInRight");
                setPreviousShowActions(showActions);
            } else {
                setActionsAnimation("animate__fadeOutLeft");
                setInvertedActionsAnimation("animate__fadeInRight");
                setLogoAnimation("animate__fadeOutLeft");
                setGroupAnimation("animate__fadeInRight");
                setPreviousShowActions(showActions);
            }
        }
    }, [showActions]);


    return (
        <div id="header" className={styles.Header}>
            <div id="header-start" className={styles.Header__Start}>
                { !isMobile && group && <>
                    <SquareButton image="/images/icons/caret/caret_left.svg" onClick={() => onBack()} />
                    {/* <h2>{group.title}</h2> */}
                </> }

                { doShowLogo ? <Logo className={`animate__animate ${logoAnimation}`} onClick={() => onHome()} onAnimationEnd={() => {
                    setLogoAnimation("");
                }} /> : <h3 className={`animate__animated ${groupAnimation}`} onClick={() => onHome()} onAnimationEnd={() => {
                    setGroupAnimation("");
                }} >{isMobile ? chat?.title : group?.title || "Group"}</h3> }
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
                    {/* <SquareButton id="logout" image="/images/icons/logout.svg" color="var(--red)" onClick={() => onLogout()}/> */}
                    <SquareButton id="toggle-theme" image="/images/icons/ic_theme.svg" onClick={() => toggleTheme() }/>
                </div>

                {
                    (isMobile ? (isSidebarCollapsed || isSidebarCollapsing) : true) && <div className={`animate__animated ${invertedActionsAnimation}`} onAnimationEnd={() => {
                        setInvertedActionsAnimation("");
                    }}>
                        { chat && (isMobile ? (isSidebarCollapsed || isSidebarCollapsing) : true) && <SquareButton id="chat-delete" image="/images/icons/trash.svg" color="var(--red)" onClick={() => {
                            onChatDelete();
                        }} /> }
                    </div>
                }

                <SquareButton disabled={isMobile && !chat} id="mobile-toggle-sidebar" image="/images/icons/sidebar.png" onClick={() => {
                    document.getElementById("toggle-sidebar").click();
                }} />
            </div>
        </div>
    )
}