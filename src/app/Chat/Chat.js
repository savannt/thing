import styles from "@/app/Chat/Chat.module.css"

import ChatMessage from "@/app/Chat/ChatMessage"

import SquareButton from "@/components/Button/SquareButton"
import Input from "@/components/Input/Input"

import ChatGraph from "@/app/Chat/ChatGraph/ChatGraph"
import Video from "@/app/Chat/Video"

import { useChannel } from "ably/react";
import { useState, useEffect } from "react"

import { chat, chatMessage } from "@/client/chat"
import toggleSidebar from "@/client/toggleSidebar"
import notification from "@/client/notification";
import useMobile from "@/providers/Mobile/useMobile"

export default function Chat ({ userId, enterpriseId, chat, group }) {
    const hasChat = !!chat && chat?.chatId;

    const isMobile = useMobile();

    // Chat Properties
    const [chatMessages, setChatMessages] = useState(chat?.messages || []);
    
    // Chat Input Bar
    const [allowSend, setAllowSend] = useState(false);
    const [inputFiles, setInputFiles] = useState([]);
    const [inputRows, setInputRows]   = useState(1);
    const [inputText, setInputText]   = useState("");

    // Animation
    // const [chatAnimation, setChatAnimation] = useState("");

    // useEffect(() => {
    //     if(chat && chat.chatId && chat.chatId !== chatId) {
    //         setChatId(chat.chatId);
    //         setChatMessages(chat.messages || []);
    //         setChatAnimation("animate__heartBeat");
    //     }
    // }, [chat]);

    function onMessageStart (message) {
        setChatMessages(prev => {
            if(!prev) prev = [];
            prev.push(message);
            return prev;
        });
    }

    function onMessageDelta ({ id, message }) {
        setChatMessages(prev => {
            if(!prev) throw new Error("onMessageDelta: no messages in chat- yet we are trying to update one");
            let index = prev.findIndex(m => m.id === id);
            if(index === -1) throw new Error("onMessageDelta: message not found in chat- yet we are trying to update it");
            prev[index].message = message;
            return prev;
        });
    }

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

    // useEffect(() => {

    // }, [chat]);

    let showNoMessages = chatMessages.length === 0;

    const [showVideo, setShowVideo] = useState(false);
    const [showChatGraph, setShowChatGraph] = useState(false);
    const [videoAnimation, setVideoAnimation] = useState("");
    const [chatAnimation, setChatAnimation] = useState("");
    const [chatGraphAnimation, setChatGraphAnimation] = useState("");


    return (
        <>
            <SquareButton id="chat-collapse-sidebar" className={`${styles.Chat__ToggleSidebar}`} image="/images/icons/sidebar.png" onClick={() => toggleSidebar() }/>
            
            {
                (showChatGraph || chatGraphAnimation) && <ChatGraph className={`animate__animated ${chatGraphAnimation}`} onAnimationEnd={() => {
                    setChatGraphAnimation("");
                    if(chatGraphAnimation.includes("fadeIn")) return;

                    if(chatGraphAnimation.includes("video")) {
                        setShowChatGraph(false);
                        setVideoAnimation("animate__fadeInRight");
                    } else {
                        setChatAnimation("animate__fadeIn");
                        setShowChatGraph(false);
                    }
                }}>
                    <input id="back-chat-graph" style={{
                        display: "none"
                    }} onClick={() => {
                        setChatGraphAnimation("animate__fadeOut");

                        if(document.getElementById("header-title")) {
                            console.log("GROUP TITLE", group);
                            document.getElementById("header-title").innerText = group?.title || "Group";
                        }
                        if(document.getElementById("sidebar-header-title")) {
                            document.getElementById("sidebar-header-title").style.visibility = "visible";
                        }
                        // setChatAnimation("animate__fadeIn");
                    }} ></input>
                </ChatGraph>
            }
            
            { (showVideo || videoAnimation) && <Video className={`aniamte__animated ${videoAnimation}`} onAnimationEnd={() => {
                console.log("ANIM_DONE", videoAnimation)
                if(videoAnimation.includes("fadeOut")) {
                    setShowVideo(false);
                    setChatAnimation("animate__fadeInRight");
                }
                setVideoAnimation("");
            }} onBack={() => {
                setVideoAnimation("animate__fadeOutRight");
            }} /> }
            
            { ((!showVideo && !showChatGraph) || chatAnimation) && <div id="chat" className={`${styles.Chat} animate__animated ${chatAnimation}`} onAnimationEnd={() => {
                if(chatAnimation.includes("chat_graph")) {
                    setShowChatGraph(true);
                    setChatGraphAnimation("animate__fadeIn");
                } else if(chatAnimation.includes("video")) {
                    setShowVideo(true);
                } else {
                    setShowVideo(false);
                }
                setChatAnimation("");
            }} style={{
                background: !chat && "var(--secondary-color)",
                opacity: !chat && 0.6
            }}>
                <div id="chat-main" className={styles.Chat__Main}>

                    {
                        showNoMessages && <p className={styles.Chat__Main__NoMessages}>{!chat ? "No chat selected" : "No messages to show" }</p>
                    }

                    {chatMessages.map((messageObject, index) => {
                        const {
                            userId,
                            message,
                            files,
                            timestamp
                        } = messageObject;

                        return (
                            <ChatMessage key={index} userId={userId} message={messageObject} />
                        )
                    })}



                </div>
                <div className={styles.Chat__Bar} style={{
                    display: chat && !isMobile ? "flex" : "none"
                }}>
                    <SquareButton className={styles.Chat__Bar__InputRow__Graph} image="/images/icons/flow.png" background={false} onClick={() => {
                        setChatAnimation("chat_graph animate__fadeOut");
                        // setChatGraphAnimation("animate__fadeIn")
                    }} />
                    <SquareButton className={styles.Chat__Bar__InputRow__Live} image="/images/icons/live.png" background={false} onClick={() => {
                        if(showVideo) {
                            setVideoAnimation("animate__fadeOutRight");
                        } else {
                            setChatAnimation("video animate__fadeOutRight");
                        }
                    }} />
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
            </div> }
        </>
    )
}