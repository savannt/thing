import styles from "@/app/Chat/Chat.module.css"

import { useState, useEffect } from "react";

export default function NoChat ({ }) {

    const [noChatAnimation, setNoChatAnimation] = useState("");

    return (
        <div id="no-chat" className={`${styles.Chat} ${styles.NoChat}  animate__animated ${noChatAnimation}`} onAnimationEnd={() => {
            setNoChatAnimation("");
        }}>
            <div id="chat-main" className={styles.Chat__Main}>
                <p className={styles.Chat__Main__NoChat}>{"No messages to show"}</p>
            </div>
        </div>
    )
}