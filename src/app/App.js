import "@/app/globals.css"

import Header from "@/app/Header/Header"

import Button from "@/components/Button/Button"
import Sidebar from "@/app/Sidebar/Sidebar"
import Chat from "@/app/Chat/Chat"

import Logo from "@/app/Header/Logo"


import SquareButton from "@/components/Button/SquareButton"

import Notifications from "@/app/Notifications/Notifications"

import getUserId from "@/client/userId"

import fetchGroups from "@/client/groups"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { SignedIn, SignedOut, SignIn, SignUp, useUser, useOrganization, useClerk } from "@clerk/nextjs"

export default function App ({ page }) {
    const FAKE_LOGIN = false;

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

    const [group, setGroup] = useState(false);
    const [chat, setChat] = useState(false);

    const [groups, setGroups] = useState([]);
    
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
                <Header      userId={userId}                                                             group={group} chat={chat} onLogout={onLogout} onBack={onBack} onHome={onHome} />
                <div id="main" style={{
                    overflow: "hidden",
                }}>
                    <Sidebar userId={userId} enterpriseId={enterpriseId} group={group} setGroup={setGroup} groups={groups} setGroups={setGroups} chat={chat} onLogout={onLogout} />
                    <Chat    userId={userId} enterpriseId={enterpriseId} group={group} setGroup={setGroup} groups={groups} setGroups={setGroups} chat={chat} />
                </div>
            </>
        )
    }

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