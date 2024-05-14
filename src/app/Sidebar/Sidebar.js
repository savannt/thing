import "animate.css";
import styles from "@/app/Sidebar/Sidebar.module.css"

import SquareButton from "@/components/Button/SquareButton"
import ColorImage from "@/components/ColorImage/ColorImage"
import Input from "@/components/Input/Input"

import NewChat from "@/app/Sidebar/NewChat"
import Profile from "@/app/Sidebar/Profile"

import DotsText from "@/components/DotsText/DotsText";


import { groupDelete } from "@/client/group";
import fetchChats from "@/client/chats";
import { chatDelete } from "@/client/chat";

import error from "@/client/error";
import notification from "@/client/notification";

import { createRef, useState, useEffect } from "react"
import useMobile from "@/providers/Mobile/useMobile";

import toggleSidebar from "@/client/toggleSidebar";


function SidebarResult ({ id, active = false, disabled = false, image, color, title, description, prefix = "", onClick, showDelete, onDelete }) {
    return (
        <div id={id} className={styles.Sidebar__Result} onClick={onClick} style={{
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : (active ? 0.8 : 1),
            background: active ? "var(--hover-active-color)" : ""
        }}>
            <ColorImage color={color} image={image} aspectRatio="1/1" />
            <div>
                <h1>{title}</h1>
                <p><b>{prefix}</b>{description}</p>
            </div>
            { showDelete && <SquareButton id={`${id}-delete`} className={styles.Sidebar__Result__Delete} image="/images/icons/trash.svg" onClick={(...e) => {
                e[0].stopPropagation();
                if(onDelete) onDelete(...e);
            }} color="var(--red)" background={false} />}
        </div>
    )
}

export default function Sidebar ({ userId, enterpriseId, groups, setGroups, group, setGroup, chat, setChat, chats, setChats, showSidebar, onLogout }) {
    let groupsArray = groups;
    
    const ref = createRef(null);

    const [disabledGroups, setDisabledGroups] = useState([]); // [groupId, groupId, groupId]
    const [disabledChats, setDisabledChats] = useState([]); // [chatId, chatId, chatId]

    const [isResizing, setIsResizing] = useState(false)
    useEffect(() => {
        function handleMouseMove (e) {
            if(isResizing) {
                ref.current.style.width = `${e.clientX}px`;
                // send resize event
                ref.current.dispatchEvent(new Event("resize"));

                localStorage.setItem("sidebar_width", e.clientX);

                updateTitleSize();
            }
        }

        function updateTitleSize () {
            if(ref && ref.current) {
                const width = ref.current.getBoundingClientRect().width;
                const headerStart = document.getElementById("header-start");
                if(headerStart) headerStart.style.maxWidth = `calc(${width}px - var(--margin-inline) - var(--margin-inline))`;
            }
        }
        updateTitleSize();

        function handleMouseUp () {
            setIsResizing(false);
        }

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        }
    }, [isResizing, ref]);

    useEffect(() => {
        const width = localStorage.getItem("sidebar_width");
        if(width && ref.current) {
            ref.current.style.width = `${width}px`;
        }
    }, [ref]);


    let results = group ? chats : groups;
    let noResults = !results || results.length === 0;
    let noResultsMessage = group ? `No chats found` : `No chat groups found`;
    let loadingResults = group ? typeof chats === "boolean" && !chats : typeof groups === "boolean" && !groups;


    const [animation, setAnimation] = useState("");
    const [secondaryAnimation, setSecondaryAnimation] = useState("");
    const [titleAnimation, setTitleAnimation] = useState("");

    const [collapsed, setCollapsed] = useState(false);
    const [collapsedFinished, setCollapsedFinished] = useState(true);
    let isCollapsed = collapsed && collapsedFinished;
    let isCollapsing = collapsed;

    const isMobile = useMobile();

    if(localStorage) {
        localStorage.setItem("sidebar_collapsed", isCollapsed);
        localStorage.setItem("sidebar_collapsing", isCollapsing);
        // dispatch update event
        window.dispatchEvent(new Event("storage"));
    }

    const chatCollapseSidebarButton = document.getElementById("chat-collapse-sidebar");
    const chatElement = document.getElementById("chat");
    if(chatCollapseSidebarButton) chatCollapseSidebarButton.style.display = collapsed ? "flex" : "none";
    if(chatElement) {
        chatElement.style.position = isCollapsed ? "absolute" : "relative";
        chatElement.style.paddingInline = (collapsed || isMobile) ? "calc(var(--margin-chat) * 3)" : "calc(var(--margin-chat) * 1)";
    }
    // console.log("isCollapsed", isCollapsed);
    

    function _onToggleSidebar () {
        setCollapsed((prev) => {
            if(prev) {
                setAnimation("fadeInRight");
                setSecondaryAnimation("opacityFadeIn");
            } else {
                setAnimation("fadeOutLeft");
                setSecondaryAnimation("opacityFadeOut");
            }
            return !prev;
        });
        setCollapsedFinished(false);
    }

    // const [lastTitle, setLastTitle] = useState(false);
    // useEffect(() => {
    //     if(chat?.title !== lastTitle) {
    //         setLastTitle(chat?.title);
    //         console.log(chat, "Title: " + chat.title, "Last Title: " + lastTitle);
    //         setTitleAnimation("animate__flipInX");
    //     }
    // }, [chat]);

    function onDeleteChat (_chat) {
        if(chat && chat.id === _chat.id) {
            setChat(false);
        }

        setDisabledChats(prev => {
            return [...prev, _chat.chatId];
        });

        chatDelete(_chat.chatId).then((status) => {
            if(status) {
                // remove _chat from chats
                console.log("Deleting chat", _chat, chats);
                
                if(group && group.groupId === _chat.groupId) {
                    setChats((prev) => {
                        return prev.filter(__chat => __chat.chatId !== _chat.chatId);
                    });
                }
                notification(`Chat "${_chat.title}" deleted`);
                
                // remove _chat from disabledChats
                setDisabledChats(prev => {
                    return prev.filter(chatId => chatId !== _chat.chatId);
                });
            } else {
                error("Failed to delete chat");
            }
        });
    }

    function onDeleteGroup(_group) {
        if(group && group.id === _group.id) {
            setGroup(false);
        }

        setDisabledGroups(prev => {
            return [...prev, _group.groupId];
        });

        groupDelete(_group.groupId).then((status) => {
            if(status) {
                // remove _group from groups
                console.log("Deleting group", _group, groupsArray);
                setGroups(groupsArray.filter(__group => __group.groupId !== _group.groupId));
                notification(`Group "${_group.title}" deleted`);
                
                // remove _group from disabledGroups
                setDisabledGroups(prev => {
                    return prev.filter(groupId => groupId !== _group.groupId);
                });
            } else {
                error("Failed to delete group");
            }
        });        
    }


    return (
        // on drag of styles.Sidebar::after resize sidebar
        <div id="sidebar" className={`${styles.Sidebar} ${animation}`} onAnimationStart={() => {
            setCollapsedFinished(false);
        }} onAnimationEnd={() => {
            // if(animation === "fadeOutLeft") setHidden(true);
            // if(animation === "fadeInRight") setHidden(false);
            // console.log("done animating", animation);
            setAnimation("");
            setCollapsedFinished(true);
        }} ref={ref} onMouseDown={(e) => (e.target === ref.current || e.target.parentElement === ref.current) && setIsResizing(true) } style={{
            // width: isCollapsed ? "0px" : "",
            // minWidth: isCollapsed ? "0px" : "",
            display: isMobile && isCollapsed ? "none" : "flex",
            // height: "100%",
            // maxHeight: "100%",
            // overflow: "hidden",
        }}>
            <input value={isCollapsed} id="toggle-sidebar" style={{
                display: "none"
            }} onClick={() => {
                _onToggleSidebar();
            }} readOnly></input>

            {
                !isMobile && <h3 className={`animate__animate ${titleAnimation}`} style={{
                    position: "absolute",
                    left: isCollapsed || isCollapsing ? "calc(max(var(--margin-chat) * 3, 0px))" : "calc(max(100% + var(--margin-chat) * 1, 11vw))",
                    bottom: "calc(100% + (var(--min-height) / 1.9))",
                    width: "max-content",
                    opacity: "1",
                    color: "var(--secondary-text-color)",
                    fontWeight: "400",
    
                    // opacity: "0",
                    // animationDelay: "2s",
                }} onAnimationEnd={() => {
                    setTitleAnimation("");
                }} >{chat ? (chat?.title || <DotsText color="var(--secondary-text-color)" ></DotsText>) : ""}</h3>
            }

            <div className={`${styles.Sidebar__Sidebar} ${secondaryAnimation}`} style={{
                display: isCollapsed ? "none" : "flex",
                borderRight: isMobile && !collapsed && collapsedFinished ? "none" : "",
                // height: `calc(100% - var(--min-height))`,
                height: "-webkit-fill-available",

                // overflow: "hidden"
            }} onAnimationEnd={() => {
                setSecondaryAnimation("");
            }} >
                <div className={styles.Sidebar__Row}>
                    { !isMobile && <SquareButton image="/images/icons/sidebar.png" onClick={() => {
                        toggleSidebar();
                    }} /> }
                    { isMobile && group && <SquareButton id="chat-back" image="/images/icons/caret/caret_left.svg" onClick={() => {
                        setGroup(false);
                    } }/> }
                    <NewChat enterpriseId={enterpriseId} chat={chat} setChat={setChat} group={group} setGroup={setGroup} onDeleteGroup={onDeleteGroup} disabledGroups={disabledGroups} groups={groupsArray} setGroups={setGroups} />
                </div>
                {
                    !!group && <div className={styles.Sidebar__Row}>
                        <Input image="/images/icons/search.svg" placeholder={group ? `Search chats in ${group?.name || "group"}` : "Search groups"} />
                    </div>
                }
                

                <div className={styles.Sidebar__Results}>
                    {
                        loadingResults && <ColorImage className={styles.Sidebar__Loading} image="/gifs/loading.gif" />
                    }
                    
                    {
                        !loadingResults && noResults && <p style={{
                            width: "-webkit-fill-available",
                            textAlign: "center",
                            color: "var(--secondary-text-color)",
                            opacity: 0.6,
                            marginTop: "calc(var(--margin-block) / 2)"
                        }}>{noResultsMessage}</p>
                    }
                    {
                        !noResults && results.map((item, index) => {
                            const title = item.title;
                            const isGroup = !!!group;


                            let prefix;
                            let description;
                            let icon = "/images/icons/chat.png";
                            if(isGroup) {
                                icon = "/images/icons/thing.png"

                                description = "Chat group"
                            } else {
                                icon = "/images/icons/chat.png"
                                
                                if(item.messages && item.messages.length > 0) {
                                    let lastMessage = item.messages[item.messages.length - 1];

                                    let lastMessageText = lastMessage.message;
                                    let lastMessageUser = lastMessage.userId;

                                    description = lastMessageText;
                                    prefix = lastMessageUser === userId ? "me: " : "";
                                } else {
                                    description = "blank chat";
                                }
                            }

                            const isDisabled = item.chatId ? disabledChats.includes(item.chatId) : disabledGroups.includes(item.groupId);
                            const isActive = chat && item.chatId && chat.chatId === item.chatId;

                            return (
                                <SidebarResult id={`${item.chatId ? `chat-${item.chatId}` : `group-${item.groupId}`}`} active={isActive} disabled={isDisabled} key={index} image={icon} title={title} description={description} prefix={prefix} onClick={() => {
                                    if(isGroup) {
                                        setGroup(item);
                                    } else {
                                        setChat(item);
                                    }
                                }} showDelete={true} onDelete={() => {
                                    if(isGroup) {
                                        onDeleteGroup(item);
                                    } else {
                                        onDeleteChat(item);
                                    }
                                }} />
                            )
                        })
                    }
                </div>

                <div className={styles.Sidebar__Footer}>
                    <Profile onLogout={onLogout} />
                </div>
            </div>
        </div>
    )
}