import "animate.css";
import styles from "@/app/Sidebar/Sidebar.module.css"

import SquareButton from "@/components/Button/SquareButton"
import ColorImage from "@/components/ColorImage/ColorImage"
import Input from "@/components/Input/Input"

import NewChat from "@/app/Sidebar/NewChat"

import { createRef, useState, useEffect } from "react"

export default function Sidebar ({ group = false, showSidebar, onToggleSidebar }) {
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

    return (
        // on drag of styles.Sidebar::after resize sidebar
        <div className={`${styles.Sidebar} animate__animated ${showSidebar ? "animate__fadeInLeft" : "animate__fadeOutLeft"}`} ref={ref} onMouseDown={(e) => e.target === ref.current && setIsResizing(true) }>
            <div className={styles.Sidebar__Row}>
                <SquareButton image="/images/icons/sidebar.png" onClick={() => onToggleSidebar() }/>
                <NewChat showDropdown={!group} />
            </div>
            
            <div className={styles.Sidebar__Row}>
                <Input image="/images/icons/search.svg" placeholder="Search chats" />
            </div>

            <div className={styles.Sidebar__Results}>
                <div className={styles.Sidebar__Result}>
                    <ColorImage image="/images/icons/chat.png" aspectRatio="1/1" />
                    <div>
                        <h1>New chat</h1>
                        <p>Some text here</p>
                    </div>
                </div>
            </div>
        </div>
    )
}