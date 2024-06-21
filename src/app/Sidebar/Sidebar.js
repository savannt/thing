import "animate.css";
import styles from "@/app/Sidebar/Sidebar.module.css"

import SquareButton from "@/components/Button/SquareButton"
import ColorImage from "@/components/ColorImage/ColorImage"
import Input from "@/components/Input/Input"

import NewChat from "@/app/Sidebar/NewChat"
import Profile from "@/app/Sidebar/Profile"

import DotsText from "@/components/DotsText/DotsText";


import { groupDelete } from "@/client/group";
import { chatDelete } from "@/client/chat";

import error from "@/client/error";
import notification from "@/client/notification";

import { createRef, useState, useEffect } from "react"
import useMobile from "@/providers/Mobile/useMobile";

import toggleSidebar from "@/client/toggleSidebar";


import { useUser, UserButton, OrganizationSwitcher } from "@clerk/nextjs";

import { useRouter } from "next/router";
import useStandalone from "@/providers/Standalone/useStandalone";

function SidebarResult ({ id, active = false, disabled = false, image, color, title, description, prefix = "", onClick, showDelete, onDelete }) {
    return (
        <div id={id} className={`${styles.Sidebar__Result} ${disabled ? styles.Sidebar__Result__Disabled : ""} ${active ? styles.Sidebar__Result___Active : ""}`} onPointerUp={(e) => {
            const target = e.target;
            if(target.id === `${id}-delete`) return;
            onClick(e);
            e.stopPropagation();
        }} onClick={(e) => {
            const target = e.target;
            if(target.id === `${id}-delete`) return;
            onClick(e);
            e.stopPropagation();
        }} style={{
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            background: active ? "var(--hover-active-color)" : ""
        }}>
            <ColorImage color={color} image={image} aspectRatio="1/1" />
            <div>
                <h1 style={{
                    color: active ? "var(--primary-text-color)" : undefined
                }}>{title}</h1>
                <p><b>{prefix}</b>{description}</p>
            </div>
            { showDelete && <SquareButton disabled={disabled} id={`${id}-delete`} className={styles.Sidebar__Result__Delete} image="/images/icons/trash.svg" onClick={(e) => {
                if(onDelete) onDelete();
                return e.stopPropagation();
            }} color="var(--red)" background={false} />}
        </div>
    )
}

export default function Sidebar ({ userId, enterpriseId, groups, setGroups, group, setGroup, chat, setChat, chats, setChats, onLogout }) {
    let groupsArray = groups;
    
    const ref = createRef(null);
    const router = useRouter();

    const isStandalone = useStandalone();

    const [disabledGroups, setDisabledGroups] = useState([]); // [groupId, groupId, groupId]
    const [disabledChats, setDisabledChats] = useState([]); // [chatId, chatId, chatId]

    const [collapsed, setCollapsed] = useState(false);
    const [collapsedFinished, setCollapsedFinished] = useState(true);
    const [isResizing, setIsResizing] = useState(false)
    const [sidebarWidth, _setSidebarWidth] = useState(0);
    
    let isCollapsed = collapsed && collapsedFinished;
    let isCollapsing = collapsed;

    const setSidebarWidth = (num) => {
        _setSidebarWidth(num);
        localStorage.setItem("sidebar_width", num);
    }

    useEffect(() => {
        function handleMouseMove (e) {
            if(isResizing) {
                // ref.current.style.width = `${e.clientX}px`;
                // send resize event


                const max = "25vw";
                const min = "275px";
                ref.current.style.width = `max(${min}, min(${max}, ${e.clientX}px))`;

                ref.current.dispatchEvent(new Event("resize"));


                setSidebarWidth(e.clientX);
                localStorage.setItem("sidebar_width", e.clientX);

                updateTitleSize();
            }
        }

        function updateTitleSize () {
            if(ref && ref.current) {
                const width = ref.current.getBoundingClientRect().width;
                const headerStart = document.getElementById("header-start");

                if(headerStart) {
                    if(isCollapsed) {
                        headerStart.style.maxWidth = `fit-content`;
                    } else {
                        headerStart.style.maxWidth = `calc(${width}px - var(--margin-inline) - var(--margin-inline))`;
                    }
                }
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


    // while isCollapsing is true- use animation frames to update setSidebarWidth with the ref.current.getBoundingClientRect().width- until isCollapsing is false
    useEffect(() => {
        if(isCollapsing) {
            let id = requestAnimationFrame(() => {
                if(ref && ref.current) {
                    setSidebarWidth(ref.current.getBoundingClientRect().width);
                }
            });
            return () => {
                cancelAnimationFrame(id);
            }
        }
    }, [isCollapsing, ref]);

    useEffect(() => {
        if(!isCollapsed && ref && ref.current) {
            setSidebarWidth(ref.current.getBoundingClientRect().width);
        }
    }, [isCollapsed, ref]);

    const { user } = useUser();

    const displayName = "Guest" || user.fullName;

    let results = group ? chats : groups;
    let noResults = !results || results.length === 0;
    let noResultsMessage = group ? `No chats found` : `No chat groups found`;
    let loadingResults = group ? typeof chats === "boolean" && !chats : typeof groups === "boolean" && !groups;


    const [animation, setAnimation] = useState("");
    const [secondaryAnimation, setSecondaryAnimation] = useState("");
    const [titleAnimation, setTitleAnimation] = useState("");

    useEffect(() => {
        const width = localStorage.getItem("sidebar_width");
        if(width && ref.current) {
            const max = "25vw";
            const min = "275px";
            ref.current.style.width = isCollapsed ? `0px` : `max(${min}, min(${max}, ${width}px))`;
        }
    }, [ref]);

    const isMobile = useMobile();
    
    if(localStorage) {
        localStorage.setItem("sidebar_collapsed", isCollapsed);
        localStorage.setItem("sidebar_collapsing", isCollapsing);
        // dispatch update event
        window.dispatchEvent(new Event("storage"));
    }

    const chatCollapseSidebarButton = document.getElementById("chat-collapse-sidebar");
    const chatElement = document.getElementById("chat");
    // if(chatCollapseSidebarButton) chatCollapseSidebarButton.style.display = collapsed ? "flex" : "none";
    if(chatElement) {
        chatElement.style.position = isCollapsed ? "absolute" : "relative";
        chatElement.style.paddingInline = (collapsed || isMobile) ? "calc(var(--margin-chat) * 3)" : "calc(var(--margin-chat) * 1)";
    }    

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


    const firstColumnStyle = {
        fontWeight: "bold",
        whiteSpace: "pre",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        width: "100%",
        fontSize: "0.9125rem"
    }

    const secondColumnStyle = {
        fontSize: "0.8125rem",
        paddingLeft: "var(--gap)",
        fontStyle: "italic",
        whiteSpace: "pre"
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
            width: isCollapsed ? "0px" : "",
            minWidth: isCollapsed ? "0px" : "",
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

            
            {/* {
                !isMobile && <h3 id="sidebar-header-title" className={`animate__animate ${titleAnimation}`} style={{
                    position: "relative",
                    left: `calc(${sidebarWidth}px)`,
                    transform: isCollapsed || isCollapsing ? "translateX(calc(3 * var(--margin-chat)))" : "translate(calc(1 * var(--margin-chat)))",
                    
                    // left: isCollapsed || isCollapsing ? `calc(${sidebarWidth}px + (var(--margin-chat) * 3))` : "calc(max(var(--margin-chat) * 3, 0px))",
                    top: `calc((var(--header-height) * -0.5))`,
                    width: "max-content",
                    opacity: "1",
                    color: "var(--secondary-text-color)",
                    fontWeight: "400",
    
                    lineHeight: "0px",

                    // opacity: "0",
                    // animationDelay: "2s",
                }} onAnimationEnd={() => {
                    setTitleAnimation("");
                }} >{chat ? (chat?.title || <DotsText color="var(--secondary-text-color)" ></DotsText>) : ""}</h3>
            } */}


            <div className={`${styles.Sidebar__Sidebar} ${secondaryAnimation} ${isStandalone ? styles.Sidebar__Sidebar___Standalone : ""}`} style={{
                display: isCollapsed ? "none" : "flex",
                borderRight: isMobile && !collapsed && collapsedFinished ? "none" : "",
                // height: `calc(100% - var(--min-height))`,
                height: "-webkit-fill-available",

                // overflow: "hidden"
            }} onAnimationEnd={() => {
                setSecondaryAnimation("");
            }} >
                <div className={styles.Sidebar__Row} style={{
                    position: "relative"
                }}>
                    {/* { !isMobile && <SquareButton image="/images/icons/sidebar.png" onClick={() => {
                        toggleSidebar();
                    }} /> } */}
                    { <div style={{ minWidth: "var(--min-height)", maxWidth: "var(--min-height)", width: "var(--min-height)" }} /> }
                    { isMobile && group && <SquareButton id="chat-back" image="/images/icons/caret/caret_left.svg" onClick={() => {
                        setGroup(false);
                    } }/> }
                    <NewChat disabled={groups === false} enterpriseId={enterpriseId} chat={chat} setChat={setChat} setChats={setChats} group={group} setGroup={setGroup} onDeleteGroup={onDeleteGroup} disabledGroups={disabledGroups} groups={groupsArray} setGroups={setGroups} />
                </div>
                {
                    !!group && <div className={styles.Sidebar__Row}>
                        <Input image="/images/icons/search.svg" placeholder={group ? `Search chats in ${group?.name || "group"}` : "Search groups"} />
                    </div>
                }
                
                <div className={styles.Sidebar__ResultsContainer}>
                    <div className={styles.Sidebar__ResultsOverlay}></div>
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
                                marginTop: "calc(var(--margin-block))"
                            }}>{noResultsMessage}</p>
                        }
                        {
                            !noResults && results.map((item, index) => {
                                const title = item.title;
                                const isGroup = !!!group;


                                let prefix;
                                let description;
                                // let icon = "/images/icons/chat.png";
                                let icon = false;
                                if(isGroup) {
                                    icon = "/images/icons/thing.png"

                                    description = "Group"
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
                                // HARD OVERRIDE HERE
                                prefix = "";
                                description = "";

                                const isDisabled = item.chatId ? disabledChats.includes(item.chatId) : disabledGroups.includes(item.groupId);
                                const isActive = chat && item.chatId && chat.chatId === item.chatId;

                                return (
                                    <SidebarResult id={`${item.chatId ? `chat-${item.chatId}` : `group-${item.groupId}`}`} active={isActive} disabled={isDisabled} key={index} image={icon} title={title} description={description} prefix={prefix} onClick={() => {
                                        let time = 0;
                                        if(document && document.getElementById("back-chat-graph")) {
                                            time = 650;
                                            document.getElementById("back-chat-graph").click();
                                        }
                                        setTimeout(() => {
                                            if(isGroup) {
                                                setGroup(item);
                                                setChats(false);
                                            } else {
                                                // setChat(item);
                                                // push query ?chatId = item.chatId

                                                router.push({
                                                    pathname: "/",
                                                    query: {
                                                        chatId: item.chatId
                                                    }
                                                }, undefined, { shallow: true });
                                            }
                                        }, time);
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
                </div>

                <div className={styles.Sidebar_Organization} onClick={(e) => {
                    setTimeout(() => {
                        if(e.target.tagName === "BUTTON") return;
                        if(!document.querySelector(".cl-organizationSwitcherPopoverCard")) {
                            if(document.querySelector(".cl-organizationSwitcherTrigger")) {
                                document.querySelector(".cl-organizationSwitcherTrigger").click();
                            }
                        }
                    }, 50);
                    return e.stopPropagation();
                }}>
                    <OrganizationSwitcher />
                </div>

                <div className={styles.Sidebar__Footer} onClick={(e) => {
                    if(document.querySelector(".cl-userButtonTrigger")) {
                        document.querySelector(".cl-userButtonTrigger").click();
                        e.stopPropagation();
                    }
                }}>
               
                    <UserButton>
                        <UserButton.UserProfileLink url="/redirect/stripe" label="Billing" labelIcon={<ColorImage image="/images/icons/billing.svg" />}/>
                        <UserButton.UserProfilePage url="/membership" label="Membership" labelIcon={<ColorImage image="/images/icons/phone.svg" />}>
                            <h1 style={{
                                fontSize: "1.0625rem",
                                fontWeight: "700",
                            }}>Membership</h1>
                            <p style={{
                                fontSize: "0.8125rem"
                            }}>You are currently using a Personal Demo Account.<br/><br/></p>
                            <h4 style={{ fontWeight: "500", marginBottom: "calc(var(--gap) * 0.5)"}}>Upgrading grants access to:</h4>
 
                            {/* <p>* <b>Organization & White-Labeling Features: </b>Gain the ability to create and manage organizations, invite team members, and customize the platform with your own branding.</p> */}
                            {/* <p>* <b>Unrestricted Access: </b>Enjoy full-speed performance with no usage limits, ensuring optimal efficiency and productivity for your team.</p> */}
                            {/* <p>* <b>Direct, Real Human Support: </b>Receive fast and on-hand support from our dedicated team of experts, ensuring you get the help you need when you need it.</p> */}
                        
                            { /* put the above in a table */ }
                            <table style={{
                                borderTop: "var(--border)"
                            }}>
                                <tr>
                                    <td style={firstColumnStyle}>Organization Features</td>
                                    <td style={secondColumnStyle}>Create and manage organizations, invite members, and customize branding</td>
                                </tr>
                                <tr>
                                    <td style={firstColumnStyle}>Unrestricted Access</td>
                                    <td style={secondColumnStyle}>Full-speed performance with no usage limits</td>
                                </tr>
                                <tr>
                                    <td style={firstColumnStyle}>Direct Human Support</td>
                                    <td style={secondColumnStyle}>Fast and dedicated support from our team</td>
                                </tr>
                            </table>
                        </UserButton.UserProfilePage>
                    </UserButton>
                    <p className={styles.Sidebar__Footer__DisplayName}>{displayName}</p>
                    <div className={styles.Sidebar__Footer__Footer}>
                        <SquareButton id="logout" background={false} image="/images/icons/logout.svg" color="var(--red)" onClick={() => onLogout()}/>
                    </div>
                </div>
            </div>
        </div>
    )
}