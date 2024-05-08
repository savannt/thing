import "@/app/globals.css"

import Header from "@/app/Header/Header"

import Sidebar from "@/app/Sidebar/Sidebar"
import Chat from "@/app/Chat/Chat"

import { useState } from "react"

export default function App () {
    const [showSidebar, setShowSidebar] = useState(true);
    const [group, setGroup] = useState({
        name: "Some Group"
    });


    function onToggleSidebar () {
        setShowSidebar(!showSidebar);
    }

    return (
        <>
            <Header group={group} onBack={() => {
                setGroup(false);
            }} />
            <div id="main">
                <Sidebar showSidebar={showSidebar} onToggleSidebar={onToggleSidebar} />
                <Chat    showSidebar={showSidebar} onToggleSidebar={onToggleSidebar} />
            </div>
        </>
    )
}