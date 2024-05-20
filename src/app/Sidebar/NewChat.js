import styles from "@/app/Sidebar/NewChat.module.css";

import Input from "@/components/Input/Input";
import Button from "@/components/Button/Button";
import SquareButton from "@/components/Button/SquareButton";


import { useState, useEffect } from "react";
import ColorImage from "@/components/ColorImage/ColorImage";


import { groupNew } from "@/client/group";
import { chatNew } from "@/client/chat";
import useMobile from "@/providers/Mobile/useMobile";
import toggleSidebar from "@/client/toggleSidebar";


export default function NewChat ({ enterpriseId, chat, setChat, group, setGroup, disabledGroups, groups, setGroups, onDeleteGroup }) {
    let showDropdown = !!!group;

    const [inputText, setInputText] = useState("");
    
    const isMobile = useMobile();
    
    const [dropdownOpen, setDropdownOpen] = useState(false);
    useEffect(() => {
        function handleDocumentClick (e) {
            if((e.target.id !== "newChat" && e.target.closest("#newChat") === null)) {
                setDropdownOpen(false);
            }
        }
        
        document.addEventListener("click", handleDocumentClick);

        return () => {
            document.removeEventListener("click", handleDocumentClick);
        }
    }, []);


    const [lockoutDropdown, setDropdownLockout] = useState(false);

    const results = groups.filter(group => group.title.toLowerCase().includes(inputText.toLowerCase()));
    const hasMatches = results.length > 0;
    const hasText = inputText && inputText.length > 0;

    function Row ({ disabled = false, id, image, text, onClick, showDelete = false, onDelete }) {
        return (
            <div id={id} className={styles.NewChat__Dropdown__Row} onClick={(...e) => {
                if(disabled) return;
                if(onClick) onClick(...e);
            }} tabIndex={1} role="button" aria-pressed={false} style={{
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1
            }}>
                { image && <ColorImage image={image} color="var(--secondary-text-color)" /> }
                <p>{text}</p>

                { showDelete && <SquareButton className={styles.NewChat__Dropdown__Row__Delete} onClick={(e) => {
                    if(onDelete) onDelete();
                    e.stopPropagation();
                }} image="/images/icons/trash.svg" color="var(--red)" background={false} /> }
            </div>
        )
    }

    return (
        <Button disabled={lockoutDropdown} id="newChat" overflow="visible" aria={true} className={styles.NewChat} image={group ? "/images/icons/plus.svg" : "/images/icons/new_chat.svg"} text={group ? `New Chat with ${group?.title}` : "New Group"} background="var(--active-color-hidden)" color="var(--active-color)" width="-webkit-fill-available" paddingRight={showDropdown ? "var(--min-height)" : "0"} onClick={(e) => {
            // if we are not in the dropdown
            if(e.target.id !== "newChatDropdownMenu" && e.target.closest("#newChatDropdownMenu") === null) {
                if(group) {
                    setDropdownLockout(true);
                    chatNew(enterpriseId, group?.groupId || false).then((newChat) => {
                        if(newChat) {
                            setChat(newChat, true);
                        } else {
                            error("Failed to create chat");
                        }
                        setDropdownLockout(false);
                    });
                } else {
                    setDropdownOpen((prev) => {
                        return !prev;
                    });
                }

            }
        }}>
            {
                showDropdown && <>
                    <SquareButton id="newChatDropdown" onClick={(e) => {
                        setDropdownOpen((prev) => {
                            return !prev;
                        });
                        e.stopPropagation();
                    }} className={styles.NewChat__DropdownButton} background={false} image="/images/icons/caret/caret_down.svg" color="var(--active-color)" />
                    { dropdownOpen && <div id="newChatDropdownMenu" className={styles.NewChat__Dropdown}>
                        <div className={styles.NewChat__Dropdown__Header}>
                            <Input doAutoFocus={true} placeholder="Search or create a group" value={inputText} onChange={(e) => {
                                setInputText(e.target.value);
                            }} onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    const button = document.getElementById("newGroup") || document.getElementById("firstGroupResult");
                                    if (button) {
                                        button.focus();  // Focus on the button
                                        button.dispatchEvent(new MouseEvent("mousedown", {bubbles: true}));
                                        setTimeout(() => {
                                            button.dispatchEvent(new MouseEvent("mouseup", {bubbles: true}));
                                            button.click(); // Fallback to ensure click is performed
                                        }, 100); // Delay to simulate user pressing and releasing
                                    }
                                }
                            }} />
                        </div>
                        {
                            !hasMatches && <>
                                
                                { hasText && <Row id={"newGroup"} background="var(--active-color-hidden)" image="/images/icons/new_chat.svg" text={`Create a new "${inputText}" group`} onClick={() => {
                                    setDropdownLockout(true);
                                    groupNew(enterpriseId, inputText).then((newGroup) => {
                                        setGroups((prev) => {
                                            return [...prev, newGroup];
                                        });
                                        setInputText("");
                                        setGroup(newGroup);
                                        setDropdownLockout(false);
                                    })
                                    
                                }} /> }

                                <div className={styles.NewChat__Dropdown__Results}>
                                    <p style={{
                                        width: "-webkit-fill-available",
                                        textAlign: "center",
                                        color: "var(--tertiary-text-color)"
                                    }}>no results</p>
                                </div>
                            </>
                        }

                        {
                            hasMatches && results.map((group, index) => {
                                let id = index === 0 ? "firstGroupResult" : "";

                                const isDisabled = disabledGroups.includes(group.groupId);

                                return <Row disabled={isDisabled} id={id} key={group.groupId} image="/images/icons/thing.png" text={group.title} onClick={() => {
                                    setGroup(group);
                                    setDropdownOpen(false);
                                }} showDelete={true} onDelete={() => {
                                    onDeleteGroup(group);
                                    // setDropdownOpen(false);
                                }} />
                            })
                        }

                    </div>}
                </>
            }
            
        </Button>
    )
}