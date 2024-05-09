import "@/app/globals.css"

import Header from "@/app/Header/Header"

import Button from "@/components/Button/Button"
import Sidebar from "@/app/Sidebar/Sidebar"
import Chat from "@/app/Chat/Chat"

import Logo from "@/app/Header/Logo"

import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import SquareButton from "@/components/Button/SquareButton"

import { SignedIn, SignedOut, SignIn, SignUp, useUser } from "@clerk/nextjs"

export default function App () {
    const FAKE_LOGIN = false;

    const router = useRouter();
    const { user, isSignedIn, isLoaded } = useUser();
    const [authLoaded, setAuthLoaded] = useState(false);
    const [authSignedIn, setAuthSignedIn] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    useEffect(() => {
        if(isLoaded) {
            setAuthLoaded(true);
            if(isSignedIn) setAuthSignedIn(true);
            else           setAuthSignedIn(false);
        } else {
            setAuthLoaded(false);
            setAuthSignedIn(false);
        }
    }, [isLoaded, isSignedIn]);

    useEffect(() => {
        if(authLoaded && !authSignedIn && (!router.asPath.includes("/login") || !router.asPath.includes("/register"))) {
            router.push("/login");
        }
    }, [router.asPath, authLoaded, authSignedIn]);


    const [showSidebar, setShowSidebar] = useState(true);
    const [group, setGroup] = useState(false);
    const [chat, setChat] = useState(false);


    function onToggleSidebar () {
        setShowSidebar(!showSidebar);
    }

    function onBack () {
        setGroup(false);
        setChat(false);
    }

    function onLogout () {
        setIsGuest(false);
        router.push("/login");
    }

    function ThingApp () {
        return (
            <>
                <Header group={group} onBack={onBack} onLogout={onLogout} />
                <div id="main">
                    <Sidebar showSidebar={showSidebar} onToggleSidebar={onToggleSidebar} group={group} chat={chat} />
                    <Chat    showSidebar={showSidebar} onToggleSidebar={onToggleSidebar} group={group} chat={chat} />
                </div>
            </>
        )
    }

    return (
        <>
            <div style={{
                width: "100vw",
                height: "100vh",
                display: FAKE_LOGIN || isGuest ? "none" : "flex",
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
                    <SignIn path="/login"/>
                    <SignUp path="/register"/>
                    { authLoaded && !authSignedIn && <p style={{
                        color: "var(--secondary-text-color)",
                        scale: "0.83"
                    }}>Continue as <a style={{
                        opacity: 0.8
                    }} onClick={() => {
                        setIsGuest(true);
                    }}>Guest</a></p> }
                </SignedOut>

                {
                    !authLoaded && <p>Loading...</p>
                }
            </div>

            <SignedIn>
                { authLoaded && !FAKE_LOGIN && <ThingApp />}
            </SignedIn>

            {
                authLoaded && (FAKE_LOGIN || isGuest) && <ThingApp />
            }
            
        </>
    )
}