import "animate.css";
import styles from "@/app/Chat/ChatMessage.module.css";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";


import { useEffect, useState } from "react";

export default function ChatMessage ({ message }) {
    const {
        role,
        content,
        timestamp
    } = message;

    if(!role) throw new Error("ChatMessage: role is required");

    // Nov 14, 2023, 2:13 PM
    let _formattedTimestamp = timestamp ? new Date(timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true
    }) : "";



    const [html, setHtml] = useState("");
    useEffect(() => {
        unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkRehype)
            .use(rehypeHighlight)
            .use(rehypeStringify)
            .process(content, (err, file) => {
                if(err) throw err;
                setHtml(String(file));
            })
    }, [content]);


    let parsedUserId = role;

    const showHeader = false;

    return (
        <div className={`${styles.ChatMessage} animate__animated animate__fadeIn`} style={{
            backgroundColor: role !== "user" ? "transparent" : undefined
        }}>
            <div className={styles.ChatMessage__Header} style={{
                display: showHeader ? "flex" : "none"
            }}>
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