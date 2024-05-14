import "@/app/globals.css"

import Header from "@/app/Header/Header"

import Button from "@/components/Button/Button"
import Sidebar from "@/app/Sidebar/Sidebar"
import Chat from "@/app/Chat/Chat"

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

import toggleSidebar from "@/client/toggleSidebar"
import useMobile from "@/providers/Mobile/useMobile"

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
    
    function setChat (chat) {
        const value = _setChat(chat);
        if(isMobile) {
            setTimeout(() => {
                toggleSidebar();
            }, 250);
        }
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
        setGroup(false);
        setChat(false);
    }

    function onHome () {
        document.getElementById("chat-collapse-sidebar").click();
    }

    function onLogout () {
        setIsGuest(false);
        signOut(() => router.push("/"));
    }

    function onChatDelete () {
        
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

    function ThingApp () {
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
                                            console.log("HERE!", chats, group);
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
                    <Chat    userId={userId} enterpriseId={enterpriseId} group={group} setGroup={setGroup} groups={groups} setGroups={setGroups} chat={chat} setChat={setChat} chats={chats} setChats={setChats} />
                </div>
            </>
        )
    }


    useEffect(() => {
        if(authLoaded && isSignedIn) {
            setTimeout(() => {
                document.getElementById("update-chats").click();
            }, 250);
        }
    }, [group, authLoaded && isSignedIn]);

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
                <SquareButton id="login-theme" image="/images/icons/ic_theme.svg" onClick={() => {
                    // toggle data-theme from light to dark
                    document.documentElement.setAttribute("data-theme", document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light")
                }}/>
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
                { authLoaded && isSignedIn && userId && <ThingApp />}
            </SignedIn>

            {/* {
                authLoaded && (FAKE_LOGIN || isGuest) && <ThingApp />
            } */}

            <Notifications />
            
        </>
    )
}