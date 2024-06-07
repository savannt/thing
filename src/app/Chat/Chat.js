import styles from "@/app/Chat/Chat.module.css"

import ChatMessage from "@/app/Chat/ChatMessage"

import SquareButton from "@/components/Button/SquareButton"
import Input from "@/components/Input/Input"

import ChatGraph from "@/app/Chat/ChatGraph/ChatGraph"
import Video from "@/app/Chat/Video"

import { useChannel } from "ably/react";
import { useState, useEffect, createRef } from "react"
import { useRouter } from "next/router"

import { chat, chatMessage } from "@/client/chat"
import toggleSidebar from "@/client/toggleSidebar"
import notification from "@/client/notification";
import useMobile from "@/providers/Mobile/useMobile"
import ChatInput from "@/app/Chat/ChatInput/ChatInput"


import Console from "@/app/Chat/Console/Console"
import useSidebarCollapsed from "@/providers/SidebarCollapsed/useSidebarCollapsed"
import { onUserMessage } from "@/client/event"
import useStandalone from "@/providers/Standalone/useStandalone"

export const SCROLL_TIMEOUT = 1500;

export default function Chat ({ console: showConsole, setConsole, graph: showChatGraph, setGraph: setShowChatGraph, userId, enterpriseId, chat, group, groups, setGroups }) {
    const hasChat = !!chat && chat?.chatId;

    const isMobile = useMobile();
    const isStandalone = useStandalone();

    const {
		collapsed: isSidebarCollapsed,
		collapsing: isSidebarCollapsing
	} = useSidebarCollapsed();
    const router = useRouter();

    const scrollRef = createRef();
    const scrollToBottom = () => {
        // scroll to bottom of #chat-main-messages
        if(document.querySelector("#chat-main-messages")) {
            document.querySelector("#chat-main-messages").scrollTo({
                top: document.querySelector("#chat-main-messages").scrollHeight,
                behavior: "smooth"
            });
        }
    }


    // Chat Properties
    const [chatMessages, setChatMessages] = useState(chat?.messages || []);
    
    // Chat Input Bar
    const [allowSend, setAllowSend] = useState(false);
    const [inputFiles, setInputFiles] = useState([]);
    const [inputRows, setInputRows]   = useState(1);
    const [inputText, setInputText]   = useState("");


    function onSend () {
        if(allowSend) {
            let _inputText = inputText;
            let _inputFiles = inputFiles;

            
            onUserMessage(chat.chatId, {
                role: "user",
                content: inputText,
            }, inputFiles === [] ? undefined : inputFiles, 5).then(data => {
                if(!data) {
                    notification("Failed to send message", "Please try again", "red");
                    return;
                }
            });


            setAllowSend(false);
            setInputText("");
            setInputFiles([]);
            setInputRows(1);
        }
    }

    // useEffect(() => {

    // }, [chat]);

    let showNoMessages = chatMessages.length === 0;

    const [showVideo, setShowVideo] = useState(false);
    const [videoAnimation, setVideoAnimation] = useState("");
    const [chatAnimation, setChatAnimation] = useState("");
    const [chatGraphAnimation, setChatGraphAnimation] = useState("");




    // if path is /?terminal=true then open console
    useEffect(() => {
        if(router.query.terminal) {
            setConsole(true);
        }
    }, [router.query.terminal]);
    


    useEffect(() => {
        setChatMessages(chat.messages || []);
        scrollToBottom();
    }, [chat])

    useChannel(`chat-${chat.chatId}`, "message", (msg) => {
        const { message } = msg.data;
        if(!message) throw new Error("No message in message event");

        const messageId = message.messageId;

        let content = "no text content";
        if(message && message.content) content = message.content;
        // notification("New message", content, "blue");

        console.log("NEW MESSAGE", message)


        scrollToBottom();
        if(message.messageId) {
            // if there is a chatmessage with the same messageId already
            const existingMessage = chatMessages.find(m => m.messageId === messageId);
    
            if(existingMessage) {
                setChatMessages(prev => {
                    // do the above in a more concise way- somehow the above is not triggering the dom to re-render
                    return prev.map(m => {
                        if(messageId && m.messageId === messageId) {
                            m.content = content;
                        }
        
                        return m;
                    });
                });
                return;
            }
        }
        setChatMessages(prev => {
            prev.push(message);
            return prev;
        });
        // append message to chatmessages
    });



    useChannel(`flow-${chat.chatId}`, "error", (msg) => {
		const data = msg.data;

        if(!showConsole) notification(data.title, data.message, "red");
	});

	useChannel(`flow-${chat.chatId}`, "log", (msg) => {
		const { messages } = msg.data;

		const formattedMessages = messages.map((message) => (typeof message !== "string" ? JSON.stringify(message) : message));
		console.log("[Flow Log]", formattedMessages.join("\n"));
	});

    const [scrollVisible, setScrollVisible] = useState(false);
    const [scrollTimeout, setScrollTimeout] = useState(null);
    useEffect(() => {
        if(scrollRef && scrollRef.current) {
            // bind to onscroll, set scrollVisible when we are scrolling
            
            const onScroll = () => {
                setScrollVisible(true);
                if(scrollTimeout) clearTimeout(scrollTimeout);

                setScrollTimeout(setTimeout(() => {
                    setScrollVisible(false);
                    setScrollTimeout(null);
                }, SCROLL_TIMEOUT))
            }

            scrollRef.current.addEventListener("scroll", onScroll);

            return () => {
                if(scrollRef && scrollRef.current) {
                    scrollRef.current.removeEventListener("scroll", onScroll);
                }
            }
        }
    }, [scrollRef]);

    return (
        <>
            <input id="toggle-terminal" style={{
                display: "none"
            }} onClick={() => {
                setConsole(prev => !prev);
            }}></input>
            { showConsole && <Console onBack={() => {
                setConsole(false);
            }} chat={chat} group={group} groups={groups} setGroups={setGroups} enterpriseId={enterpriseId} messages={chatMessages} /> }

            <SquareButton id="chat-collapse-sidebar" className={`${styles.Chat__ToggleSidebar}`} image="/images/icons/sidebar.png" onClick={() => toggleSidebar() }/>
            
            {
                (showChatGraph || chatGraphAnimation) && <ChatGraph chat={chat} group={group} enterpriseId={enterpriseId} className={`animate__animated ${chatGraphAnimation}`} onAnimationEnd={(e) => {
                    if(e.target.id !== "chat-graph") return;


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
            
            { ((!showVideo && !showChatGraph) || chatAnimation) && <div id="chat" className={`${styles.Chat} ${isStandalone ? styles.Chat___Standalone : ""} animate__animated ${chatAnimation}`} onAnimationEnd={() => {
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
                opacity: !chat && 0.6,
                position: "relative"
            }}>
                <div id="chat-main" className={styles.Chat__Main}>
                    <div className={styles.Chat__Main__Fade}></div>
                    <div className={`${styles.Chat__Main__ScrollOverlay} animate__animated ${!scrollVisible ? "animate__fadeIn" : "animate__fadeOut"}`}></div>


                    <div id="chat-main-messages" className={styles.Chat__Main__Messages}>
                        {
                            showNoMessages && <p className={styles.Chat__Main__NoMessages}>{!chat ? "No chat selected" : "No messages to show" }</p>
                        }

                        {
                            chatMessages.map((message, index) => {
                                return (
                                    <ChatMessage key={index} message={message} />
                                )
                            })
                        }
                    </div>
                </div>


                <div className={styles.Chat__Bar} style={{
                    // if chat, flex, else none
                    // but if isMoile and isSidebarCollapsed, none
                    display: chat ? ((isMobile && (!isSidebarCollapsed && !isSidebarCollapsing)) ? "none" : "flex") : "none"
                }}>
                    <div className={styles.Chat__Bar__Buttons}>
                        <SquareButton className={styles.Chat__Bar__InputRow__Live} image="/images/icons/facetime.png" background={false} onClick={() => {
                            if(showVideo) {
                                setVideoAnimation("animate__fadeOutRight");
                            } else {
                                setChatAnimation("video animate__fadeOutRight");
                            }
                        }} />
                        <SquareButton className={styles.Chat__Bar__InputRow__Graph} image="/images/icons/nodes.png" background={false} onClick={() => {
                            setChatAnimation("chat_graph animate__fadeOut");
                            // setChatGraphAnimation("animate__fadeIn")
                        }} />
                        <SquareButton className={styles.Chat__Bar__InputRow__Console} image="/images/icons/console.png" background={false} onClick={() => {
                            setConsole(true);
                        }} />
                    </div>
                    <div className={styles.Chat__Bar__InputRow}>
                        <ChatInput allowSend={allowSend} inputText={inputText} inputRows={inputRows} onChange={(e) => {
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
                        }} onFileChange={(e) => {
                            if (e.target.files.length > 0) {
                                setAllowSend(true);
                            }
                        }} onSend={onSend} />
                    </div>
                </div>
            </div> }
        </>
    )
}