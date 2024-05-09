import "animate.css";
import styles from "@/app/Sidebar/Sidebar.module.css"

import SquareButton from "@/components/Button/SquareButton"
import ColorImage from "@/components/ColorImage/ColorImage"
import Input from "@/components/Input/Input"

import NewChat from "@/app/Sidebar/NewChat"
import Profile from "@/app/Sidebar/Profile"

import { createRef, useState, useEffect } from "react"

export default function Sidebar ({ group, chat, showSidebar, onToggleSidebar, onLogout }) {
    const ref = createRef(null);

    const [isResizing, setIsResizing] = useState(false)
    useEffect(() => {
        function handleMouseMove (e) {
            if(isResizing) {
                ref.current.style.width = `${e.clientX}px`;
                // send resize event
                ref.current.dispatchEvent(new Event("resize"));
            }
        }

        function handleMouseUp () {
            setIsResizing(false);
        }

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        }
    }, [isResizing, ref]);



    let noResults = true;


    const [animation, setAnimation] = useState(showSidebar ? "fadeInRight" : "fadeOutLeft");
    const [hidden, _setHidden] = useState(false);
    function setHidden (val) {
        console.log("setHidden", val)
        _setHidden(val);
    }
    useEffect(() => {
        setAnimation(showSidebar ? "fadeInRight" : "fadeOutLeft");
    }, [showSidebar])

    return (
        // on drag of styles.Sidebar::after resize sidebar
        <div id="sidebar" className={`${styles.Sidebar} ${animation}`} onAnimationEnd={() => {
            if(animation === "fadeOutLeft") setHidden(true);
            if(animation === "fadeInRight") setHidden(false);
            console.log("done animating", animation);
            setAnimation("");
        }} ref={ref} onMouseDown={(e) => (e.target === ref.current || e.target.parentElement === ref.current) && setIsResizing(true) } style={{
            width: hidden ? "0px" : "",
            minWidth: hidden ? "0px" : "",
        }}>
            <h3 style={{
                position: "absolute",
                left: !showSidebar ? "calc(max(var(--margin-inline) * 9, 0px))" : "calc(max(100% + var(--margin-inline) * 3, 11vw))",
                bottom: "calc(100% + (var(--min-height) / 2 + 3px))",
                width: "500px",
                opacity: "1"
            }}>chat group / a chat</h3>

            <div className={`${styles.Sidebar__Sidebar} ${showSidebar ? "opacityFadeIn" : "opacityFadeOut"}`} style={{
                display: hidden ? "none" : "flex",
            }} >
                <div className={styles.Sidebar__Row}>
                    <SquareButton image="/images/icons/sidebar.png" onClick={() => onToggleSidebar() }/>
                    <NewChat group={group} />
                </div>
                
                <div className={styles.Sidebar__Row}>
                    <Input image="/images/icons/search.svg" placeholder={group ? `Search chats in ${group?.name || "group"}` : "Search groups"} />
                </div>

                <div className={styles.Sidebar__Results}>
                    {
                        noResults && <p style={{
                            width: "-webkit-fill-available",
                            textAlign: "center",
                            color: "var(--secondary-text-color)",
                            opacity: 0.6,
                            marginTop: "calc(var(--margin-block) / 2)"
                        }}>{group ? `No chats found` : `No chat groups found` }</p>
                    }

                    {/* <div className={styles.Sidebar__Result}>
                        <ColorImage image="/images/icons/chat.png" aspectRatio="1/1" />
                        <div>
                            <h1>New chat</h1>
                            <p>Some text here</p>
                        </div>
                    </div> */}
                </div>

                <div className={styles.Sidebar__Footer}>
                    <Profile onLogout={onLogout} />
                </div>
            </div>
        </div>
    )
}