import "animate.css";
import styles from "@/app/Sidebar/Sidebar.module.css"

import SquareButton from "@/components/Button/SquareButton"
import ColorImage from "@/components/ColorImage/ColorImage"
import Input from "@/components/Input/Input"

import NewChat from "@/app/Sidebar/NewChat"
import Profile from "@/app/Sidebar/Profile"

import DotsText from "@/components/DotsText/DotsText";


import { groupDelete } from "@/client/group";
import error from "@/client/error";
import notification from "@/client/notification";

import { createRef, useState, useEffect } from "react"
import useMobile from "@/providers/Mobile/useMobile";


function SidebarResult ({ disabled = false, image, color, title, description, onClick, showDelete, onDelete }) {
    return (
        <div className={styles.Sidebar__Result} onClick={onClick} style={{
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1
        }}>
            <ColorImage color={color} image={image} aspectRatio="1/1" />
            <div>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
            { showDelete && <SquareButton className={styles.Sidebar__Result__Delete} image="/images/icons/trash.svg" onClick={(...e) => {
                e[0].stopPropagation();
                if(onDelete) onDelete(...e);
            }} color="var(--red)" background={false} />}
        </div>
    )
}

export default function Sidebar ({ userId, enterpriseId, groups, setGroups, group, setGroup, chat, showSidebar, onLogout }) {
    function onToggleSidebar () {
        if(!document.getElementById("toggle-sidebar")) return alert("A Fatal Error Has Occured:\n\nuhh, jeepers this ain't good chief-\nI can't find the sidebar toggle button");
        document.getElementById("toggle-sidebar").click();
    }
    let groupsArray = groups;
    
    const ref = createRef(null);

    const [disabledGroups, setDisabledGroups] = useState([]); // [groupId, groupId, groupId]

    const [isResizing, setIsResizing] = useState(false)
    useEffect(() => {
        function handleMouseMove (e) {
            if(isResizing) {
                ref.current.style.width = `${e.clientX}px`;
                // send resize event
                ref.current.dispatchEvent(new Event("resize"));


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


    let results = group ? [] : groups;
    let noResults = !results || results.length === 0;
    let noResultsMessage = group ? `No chats found` : `No chat groups found`;


    // const [hidden, _setHidden] = useState(false);
    // function setHidden (val) {
        //     console.log("setHidden", val)
        //     _setHidden(val);
        // }
    // useEffect(() => {
        //     setAnimation(showSidebar ? "fadeInRight" : "fadeOutLeft");
        // }, [showSidebar])
    const [animation, setAnimation] = useState("");
    const [secondaryAnimation, setSecondaryAnimation] = useState("");

    const [collapsed, setCollapsed] = useState(false);
    const [collapsedFinished, setCollapsedFinished] = useState(false);
    let isCollapsed = collapsed && collapsedFinished;

    const isMobile = useMobile();

    if(localStorage) {
        localStorage.setItem("sidebar_collapsed", isCollapsed);
        // dispatch update event
        window.dispatchEvent(new Event("storage"));
    }

    const chatCollapseSidebarButton = document.getElementById("chat-collapse-sidebar");
    const chatElement = document.getElementById("chat");
    if(chatCollapseSidebarButton) chatCollapseSidebarButton.style.display = collapsed ? "flex" : "none";
    if(chatElement) {
        chatElement.style.position = isCollapsed ? "absolute" : "relative";
        chatElement.style.marginInline = collapsed ? "calc(var(--margin-chat) * 3)" : "calc(var(--margin-chat) * 1)";
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
        <div id="sidebar" className={`${styles.Sidebar} ${animation}`} onAnimationEnd={() => {
            // if(animation === "fadeOutLeft") setHidden(true);
            // if(animation === "fadeInRight") setHidden(false);
            // console.log("done animating", animation);
            setAnimation("");
            setCollapsedFinished(true);
        }} ref={ref} onMouseDown={(e) => (e.target === ref.current || e.target.parentElement === ref.current) && setIsResizing(true) } style={{
            width: isCollapsed ? "0px" : "",
            minWidth: isCollapsed ? "0px" : "",
            // maxWidth: collapsed ? "0px" : "",
        }}>
            <input value={isCollapsed} id="toggle-sidebar" style={{
                display: "none"
            }} onClick={() => {
                _onToggleSidebar();
            }} readOnly></input>

            <h3 style={{
                position: "absolute",
                left: isCollapsed ? "calc(max(var(--margin-chat) * 3, 0px))" : "calc(max(100% + var(--margin-chat) * 1, 11vw))",
                bottom: "calc(100% + (var(--min-height) / 2.8))",
                width: "max-content",
                opacity: "1",
                color: "var(--secondary-text-color)",
                fontWeight: "400"
            }}>{chat?.title || <DotsText color="var(--secondary-text-color)" ></DotsText>}</h3>

            <div className={`${styles.Sidebar__Sidebar} ${secondaryAnimation}`} style={{
                display: isCollapsed ? "none" : "flex",
            }} onAnimationEnd={() => {
                setSecondaryAnimation("");
            }} >
                <div className={styles.Sidebar__Row}>
                    <SquareButton image="/images/icons/sidebar.png" onClick={() => onToggleSidebar() }/>
                    <NewChat enterpriseId={enterpriseId} group={group} setGroup={setGroup} onDeleteGroup={onDeleteGroup} disabledGroups={disabledGroups} groups={groupsArray} setGroups={setGroups} />
                </div>
                {
                    !!group && <div className={styles.Sidebar__Row}>
                        <Input image="/images/icons/search.svg" placeholder={group ? `Search chats in ${group?.name || "group"}` : "Search groups"} />
                    </div>
                }
                

                <div className={styles.Sidebar__Results}>
                    {
                        noResults && <p style={{
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

                            
                            let description;
                            let icon = "/images/icons/chat.png";
                            if(isGroup) {
                                icon = "/images/icons/thing.png"

                                description = "Chat group"
                            } else {
                                icon = "/images/icons/chat.png"
                                
                                if(item.messages && item.messages.length > 0) {
                                    description = item.messages[item.messages.length - 1].text;
                                } else {
                                    description = "No messages";
                                }
                            }

                            const isDisabled = disabledGroups.includes(item.groupId);

                            return (
                                <SidebarResult disabled={isDisabled} key={index} image={icon} title={title} description={description} onClick={() => {
                                    if(isGroup) {
                                        setGroup(item);
                                    } else {
                                        error("not implemented");
                                    }
                                }} showDelete={true} onDelete={() => {
                                    if(isGroup) {
                                        onDeleteGroup(item);
                                    } else {
                                        error("not implemented");
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