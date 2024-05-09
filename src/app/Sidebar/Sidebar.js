import "animate.css";
import styles from "@/app/Sidebar/Sidebar.module.css"

import SquareButton from "@/components/Button/SquareButton"
import ColorImage from "@/components/ColorImage/ColorImage"
import Input from "@/components/Input/Input"

import NewChat from "@/app/Sidebar/NewChat"
import Profile from "@/app/Sidebar/Profile"

import { createRef, useState, useEffect } from "react"

export default function Sidebar ({ group, chat, showSidebar, onToggleSidebar }) {
    const ref = createRef(null);

    const [isResizing, setIsResizing] = useState(false)
    useEffect(() => {
        function handleMouseMove (e) {
            if(isResizing) {
                ref.current.style.width = `${e.clientX}px`;
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



    return (
        // on drag of styles.Sidebar::after resize sidebar
        <div className={`${styles.Sidebar} animate__animated ${showSidebar ? "animate__fadeInLeft" : "animate__fadeOutLeft"}`} ref={ref} onMouseDown={(e) => e.target === ref.current && setIsResizing(true) }>
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
                <Profile />
            </div>
        </div>
    )
}