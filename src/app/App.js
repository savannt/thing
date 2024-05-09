import "@/app/globals.css"

import Header from "@/app/Header/Header"

import Button from "@/components/Button/Button"
import Sidebar from "@/app/Sidebar/Sidebar"
import Chat from "@/app/Chat/Chat"

import Logo from "@/app/Header/Logo"

import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { SignedIn, SignedOut, SignIn, SignUp, useUser } from "@clerk/nextjs"

export default function App () {
    const FAKE_LOGIN = true;


    const router = useRouter();
    const { user, isSignedIn, isLoaded } = useUser();
    const [authLoaded, setAuthLoaded] = useState(false);
    const [authSignedIn, setAuthSignedIn] = useState(false);
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

    function ThingApp () {
        return (
            <>
                
                <Header group={group} onBack={onBack} />
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
                display: FAKE_LOGIN ? "none" : "flex",
                flexDirection: "column",
                gap: "calc(var(--gap) * 3)",
                justifyContent: "center",
                alignItems: "center"

            }}>
                <Logo scale="1.7" />
                <SignedOut>
                    <SignIn path="/login"/>
                    <SignUp path="/register"/>
                </SignedOut>

                {
                    !authLoaded && <p>Loading...</p>
                }
            </div>

            <SignedIn>
                { authLoaded && !FAKE_LOGIN && <ThingApp />}
            </SignedIn>

            {
                authLoaded && FAKE_LOGIN && <ThingApp />
            }
            
        </>
    )
}