import styles from "@/app/Chat/ChatMessage.module.css";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";


import { useEffect, useState } from "react";

export default function ChatMessage ({ userId: myUserId, message }) {
    const {
        userId,
        message: messageStr,
        files,
        timestamp
    } = message;

    if(!userId) throw new Error("ChatMessage: userId is required");
    if(!messageStr) throw new Error("ChatMessage: message is required");
    if(!timestamp) throw new Error("ChatMessage: timestamp is required");

    // Nov 14, 2023, 2:13 PM
    let _formattedTimestamp = new Date(timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true
    });



    const [html, setHtml] = useState("");
    useEffect(() => {
        unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkRehype)
            .use(rehypeHighlight)
            .use(rehypeStringify)
            .process(messageStr, (err, file) => {
                if(err) throw err;
                setHtml(String(file));
            })
    }, [messageStr]);


    let parsedUserId = userId === myUserId ? "You" : userId;


    return (
        <div className={styles.ChatMessage}>
            <div className={styles.ChatMessage__Header}>
                <div className={styles.ChatMessage__Header__Start}>
                    <h1>{parsedUserId || ""}</h1>
                    <h2 suppressHydrationWarning>{_formattedTimestamp || ""}</h2>
                </div>
                <div className={styles.ChatMessage__Header__End}>

                </div>
            </div>
            <div className={styles.ChatMessage__Html} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    )
}