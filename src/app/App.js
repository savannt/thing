import "@/app/globals.css"
import styles from "@/app/Chat/Chat.module.css"

import Header from "@/app/Header/Header"

import Button from "@/components/Button/Button"
import Sidebar from "@/app/Sidebar/Sidebar"
import Chat from "@/app/Chat/Chat"
import NoChat from "@/app/Chat/NoChat"

import Logo from "@/app/Header/Logo"


import SquareButton from "@/components/Button/SquareButton"

import Notifications from "@/app/Notifications/Notifications"

import getUserId from "@/client/userId"

import fetchChats from "@/client/chats"
import fetchGroups from "@/client/groups"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { SignedIn, SignedOut, SignIn, SignUp, useUser, useOrganization, useClerk } from "@clerk/nextjs"
import notification from "@/client/notification"
import { useChannel } from "ably/react"

import toggleSidebar from "@/client/toggleSidebar"
import useMobile from "@/providers/Mobile/useMobile"
import tryUntilSuccess from "@/client/tryUntilSuccess"
import toggleTheme from "@/client/toggleTheme"


function ThingApp ({ enterpriseId, group, setGroup, groups, setGroups, chat, chats, setChats, setChat, userId, onLogout, onBack, onHome, onChatDelete}) {
    return (
        <>
            <button id="update-chats" style={{
                display: "none"
            }} onClick={() => {
                const updateChats = () => {
                    return new Promise(resolve => {
                        fetchChats(enterpriseId, 20, group?.groupId || false).then(chats => {
                            let _chats = [];
                
                            if(Array.isArray(chats)) {
                                _chats = chats;
                            } else {
                                if(group && group.groupId) {
                                    if(chats[group.groupId]) {
                                        _chats = chats[group.groupId];
                                    } else {
                                        error("Failed to fetch chats, group not found");
                                    }
                                } else {
                                    if(chats["ungrouped"]) {
                                        _chats = chats["ungrouped"];
                                    } else {
                                        error("Failed to fetch chats, ungrouped not found");
                                    }
                                }
                            }
            
                            // setChats(_chats);
                            resolve(_chats);
                        });
                    });
                }

                updateChats().then(_chats => {
                    setChats(_chats);
                });
            }} />

            <Header      userId={userId}                                                             group={group} chat={chat} onLogout={onLogout} onBack={onBack} onHome={onHome} onChatDelete={onChatDelete} />
            <div id="main" style={{
                // overflow: "hidden",
            }}>
                <Sidebar userId={userId} enterpriseId={enterpriseId} group={group} setGroup={setGroup} groups={groups} setGroups={setGroups} chat={chat} setChat={setChat} chats={chats} setChats={setChats} onLogout={onLogout} />
                <SquareButton id="chat-collapse-sidebar" className={`${styles.Chat__ToggleSidebar}`} image="/images/icons/sidebar.png" onClick={() => toggleSidebar() }/>
                { chat && chat?.chatId && <Chat    userId={userId} enterpriseId={enterpriseId} group={group} chat={chat} setChat={setChat} /> }
                { !chat && !chat?.chatId && <NoChat /> }
            </div>
        </>
    )
}

export default function App ({ page }) {
    const FAKE_LOGIN = false;
    const isMobile = useMobile();

    const router = useRouter();
    const { signOut } = useClerk();
    const { user, isSignedIn, isLoaded } = useUser();
    const { organization } = useOrganization();


    const [userId, setUserId] = useState(false);
    const enterpriseId = organization?.id || false;

    const [authLoaded, setAuthLoaded] = useState(false);
    const [authSignedIn, setAuthSignedIn] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    useEffect(() => {
        console.log("IS_LODAED_EFFECT", isLoaded, isSignedIn)
        if(isLoaded) {
            setAuthLoaded(true);
            if(isSignedIn) {
                getUserId().then(userId => {
                    if(userId) {
                        setUserId(userId);
                        setAuthSignedIn(true);
                    } else {
                        setAuthSignedIn(false);
                    }
                });
            }
            else setAuthSignedIn(false);
        } else {
            setAuthLoaded(false);
            setAuthSignedIn(false);
        }
    }, [isLoaded, isSignedIn]);

    const [chat, _setChat] = useState(false);
    const [chats, setChats] = useState(false);
    const [group, setGroup] = useState(false);
    const [groups, setGroups] = useState([]);
    
    const [title, setTitle] = useState(false);



    function onTitleUpdate ({ title }) {
        notification("Chat title updated", title, "#00FF00");
        setTitle(title);
    }


    // useChannel(`chat-test`, "title", (msg) => {
    //     if(!msg || !msg.data) { console.error("Invalid title message", msg); return; }
    //     const { data } = msg;

    //     if(!data.title) throw new Error("No title sent in title update message");
    //     const { title } = data;

    //     onTitleUpdate({ title });
    // });


    // useEffect(() => {
    //     if(chat && chat.chatId) {
    //         const chatId = chat.chatId;

    //         const { channel: titleUpdateChannel } = useChannel(`chat-${chatId}`, "title", (msg) => {
    //             if(!msg || !msg.data) { console.error("Invalid title message", msg); return; }
    //             const { data } = msg;
        
    //             if(!data.title) throw new Error("No title sent in title update message");
    //             const { title } = data;
        
    //             onTitleUpdate({ title });
    //         });

    //         setTitle(chat.title);
    //     }
    // }, [chat]);


    function setChat (chat, doPushIsNew = false) {
        const value = _setChat(chat);
        if(isMobile) {
            setTimeout(() => {
                toggleSidebar();
            }, 250);
        }
        if(doPushIsNew) {
            setChats((prev) => {
                if(prev) {
                    return [chat, ...prev];
                } else {
                    return [chat];
                }
            });
        }

        // add "animate__heartBeat" to #chat
        setTimeout(() => {
            const chatElement = document.getElementById("chat");
            if(chatElement) chatElement.classList.add("animate__heartBeat");
        }, 50);

        return value;
    }

    useEffect(() => {        
        if(enterpriseId) {
            fetchGroups(enterpriseId).then(_groups => {
                setGroups(_groups);
            });
        }
    }, [enterpriseId]);


    function onBack () {
        if(document.getElementById("back-chat-graph")) {
            document.getElementById("back-chat-graph").click();
        } else {
            setGroup(false);
            // setChat(false);
        }
    }

    function onHome () {
        if(document.getElementById("back-chat-graph")) {
            document.getElementById("back-chat-graph").click();
        } else {
            document.getElementById("chat-collapse-sidebar").click();
        }
    }

    function onLogout () {
        setIsGuest(false);
        signOut(() => router.push("/"));
    }

    function onChatDelete () {
        const element = document.getElementById(`chat-${chat.chatId}-delete`);
        if(!element) error("Failed to delete chat, element not found");
        else element.click();
    }

    const [viewportHeight, setViewportHeight] = useState(0);
    useEffect(() => {
        function handleResize () {
            window.scrollTo(0, 1);
            setViewportHeight(window.visualViewport.height);
        }
        handleResize();

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        }
    }, []);


    useEffect(() => {
        if(authLoaded && isSignedIn) {
            tryUntilSuccess(() => {
                if(!document.getElementById("update-chats")) return false;
                document.getElementById("update-chats").click();
                return true;
            });
        }
    }, [group, authLoaded && isSignedIn]);




    if(chat && title) chat.title = title;
    return (
        <>
            <div style={{
                width: "100vw",
                height: viewportHeight + "px",
                display: authLoaded && !isGuest && !isSignedIn ? "flex" : "none",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "12px"
            }}>
                <SquareButton id="login-theme" image="/images/icons/ic_theme.svg" onClick={() => toggleTheme() }/>
                <Logo scale="1.7" style={{
                    marginBottom: "calc(var(--gap) * 3)"  
                }} />




                <SignedOut>
                    {page === "register" ? <SignUp routing="hash"/> : <SignIn routing="hash"/>}
                    
                    {/* { authLoaded && !authSignedIn && <p style={{
                        color: "var(--secondary-text-color)",
                        scale: "0.83"
                    }}>Continue as <a style={{
                        opacity: 0.8
                    }} onClick={() => {
                        setIsGuest(true);
                    }}>Guest</a></p> } */}
                </SignedOut>

                {
                    !authLoaded && <p>Loading...</p>
                }
            </div>

            <SignedIn>
                { authLoaded && isSignedIn && userId && <ThingApp
                    enterpriseId={enterpriseId}
                    group={group}
                    setGroup={setGroup}
                    groups={groups}
                    setGroups={setGroups}
                    chat={chat}
                    chats={chats}
                    setChats={setChats}
                    setChat={setChat}
                    userId={userId}

                    onLogout={onLogout}
                    onBack={onBack}
                    onHome={onHome}
                    onChatDelete={onChatDelete}
                /> }
            </SignedIn>

            {/* {
                authLoaded && (FAKE_LOGIN || isGuest) && <ThingApp />
            } */}

            <Notifications />
            
        </>
    )
}