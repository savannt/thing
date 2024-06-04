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
import SearchMenu, { SearchMenuRow } from "@/components/SearchMenu/SearchMenu";


export default function NewChat ({ enterpriseId, chat, setChat, setChats, group, setGroup, disabledGroups, groups, setGroups, onDeleteGroup }) {
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

    const results = groups ? groups.filter(group => group.title.toLowerCase().includes(inputText.toLowerCase())) : [];
    const hasMatches = results.length > 0;
    const hasText = inputText && inputText.length > 0;

    return (
        <>
            {
                showDropdown && <>
                    { dropdownOpen && <SearchMenu id="newChatDropdownMenu" hasResults={hasMatches || hasText} inputText={inputText} setInputText={setInputText} placeholder={`Search or create a 𝑡ℎ𝑖𝑛𝑔`} className={styles.NewChat__Dropdown}>
                        {
                            !hasMatches && hasText && <SearchMenuRow id={"newGroup"} background="var(--active-color-hidden)" image="/images/icons/new_chat.svg" text={`Create a new "${inputText}" 𝑡ℎ𝑖𝑛𝑔`} onClick={() => {
                                setDropdownOpen(false);
                                setDropdownLockout(true);
                                groupNew(enterpriseId, inputText).then((newGroup) => {
                                    setGroups((prev) => {
                                        return [...prev, newGroup];
                                    });
                                    setInputText("");
                                    setGroup(newGroup);
                                    setChats(false);
                                    setDropdownLockout(false);
                                })
                            }} />
                        }
                        {
                            hasMatches && results.map((group, index) => {
                                let id = index === 0 ? "firstGroupResult" : "";
                                const isDisabled = disabledGroups.includes(group.groupId);
                                return <SearchMenuRow disabled={isDisabled} id={id} key={group.groupId} image="/images/icons/thing.png" text={group.title} onClick={() => {
                                    setGroup(group);
                                    setChats(false);
                                    setDropdownOpen(false);
                                }} showDelete={true} onDelete={() => {
                                    onDeleteGroup(group);
                                    // setDropdownOpen(false);
                                }} />
                            })
                        }
                        </SearchMenu>
                    }
                </>
            }

            
            <Button disabled={lockoutDropdown} id="newChat" overflow="visible" aria={true} className={styles.NewChat} image={group ? "/images/icons/plus.svg" : "/images/icons/new_chat.svg"} text={group ? `${group?.title}` : "New 𝑡ℎ𝑖𝑛𝑔"} background="var(--active-color-hidden)" color="var(--active-color)" width="-webkit-fill-available" paddingRight={showDropdown ? "var(--min-height)" : "0"} onClick={(e) => {
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
                    </>
                }
            </Button>
        </>
    )
}