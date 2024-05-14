import styles from "@/app/Chat/Chat.module.css"

import SquareButton from "@/components/Button/SquareButton"
import Input from "@/components/Input/Input"

import ChatMessage from "@/app/Chat/ChatMessage"


import { chat, chatMessage } from "@/client/chat"

import { useState } from "react"

import toggleSidebar from "@/client/toggleSidebar"

export default function Chat ({ group, chat, showSidebar }) {

    const [chatMessages, setChatMessages] = useState(chat?.messages || []);

    const [allowSend, setAllowSend] = useState(false);
    const [inputFiles, setInputFiles] = useState([]);
    const [inputRows, setInputRows]   = useState(1);
    const [inputText, setInputText]   = useState("");

    function send () {
        if(allowSend) {
            let _inputText = inputText;
            let _inputFiles = inputFiles;

            setAllowSend(false);
            setInputText("");
            setInputFiles([]);
            setInputRows(1);


            chatMessage(chat.chatId, enterpriseId, _inputText, _inputFiles).then(data => {
                if(data) {
                    
                } else {
                    error("Failed to send message");
                }
            });
        }
    }

    let showNoMessages = chatMessages.length === 0;

    return (
        <>
            <SquareButton id="chat-collapse-sidebar" className={`${styles.Chat__ToggleSidebar}`} image="/images/icons/sidebar.png" onClick={() => toggleSidebar() }/>
            
            <div id="chat" className={`${styles.Chat} animate__animated animate__fadeIn`}>
                <div id="chat-main" className={styles.Chat__Main}>

                    {
                        showNoMessages && <p className={styles.Chat__Main__NoMessages}>No messages to show</p>
                    }

                    {chatMessages.map((messageObject, index) => {
                        const {
                            userId,
                            message,
                            files,
                            timestamp
                        } = messageObject;

                        return (
                            <ChatMessage key={index} message={messageObject} />
                        )
                    })}



                </div>
                <div className={styles.Chat__Bar}>
                    <div className={styles.Chat__Bar__InputRow}>
                        <Input hiddenFocus={!allowSend} textarea={true} placeholder="Send a message" value={inputText} rows={inputRows} onChange={(e) => {
                            setInputText(e.target.value);
                            setInputRows(e.target.value.split("\n").length);

                            if(e.target.value.length === 0) {
                                if(inputFiles.length === 0) {
                                    setAllowSend(false);
                                }
                            } else {
                                setAllowSend(true);
                            }
                        }} onKeyPress={(e) => {
                            // if key is enter and not shift being pressed, click #send
                            if(e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                document.querySelector(`#send`).click();
                            } else {
                                if(e.target.value.length === 0) {
                                    if(inputFiles.length === 0) {
                                        setAllowSend(false);
                                    }
                                } else {
                                    setAllowSend(true);
                                }
                            }
                        }}>
                            <input style={{ display: "none" }} type="file" id="file" accept="image/*" onChange={(e) => {
                                if (e.target.files.length > 0) {
                                    setAllowSend(true);
                                }
                            }}/>
                            <SquareButton className={styles.Chat__Bar__InputRow__Attachment} image="/images/icons/upload.png" background={false} color="var(--secondary-text-color)" onClick={() => {
                                document.getElementById("file").click();
                            }}/>
                        </Input>
                        <SquareButton id="send" image="/images/icons/send.png" color={allowSend ? "white" : "var(--primary-text-color)"} background={allowSend ? "var(--action-color)" : "var(--disabled-color)"} disabled={!allowSend} onClick={() => {
                            send();
                        }}/>
                    </div>
                </div>
            </div>
        </>
    )
}