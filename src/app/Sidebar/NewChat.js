import styles from "@/app/Sidebar/NewChat.module.css";

import Input from "@/components/Input/Input";
import Button from "@/components/Button/Button";
import SquareButton from "@/components/Button/SquareButton";


import { useState, useEffect } from "react";

export default function NewChat ({ group }) {
    let showDropdown = !!!group;

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [inputText, setInputText] = useState("");

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

    return (
        <Button id="newChat" aria={true} className={styles.NewChat} image="/images/icons/plus.svg" text={group ? "New Chat" : "New Chat Group"} background="var(--active-color-hidden)" color="var(--active-color)" width="-webkit-fill-available" paddingRight={showDropdown ? "var(--min-height)" : "0"}>
            {
                showDropdown && <>
                    <SquareButton id="newChatDropdown" onClick={(e) => {
                        setDropdownOpen((prev) => {
                            return !prev;
                        });
                        e.stopPropagation();
                    }} className={styles.NewChat__DropdownButton} background={false} image="/images/icons/caret/caret_down.svg" color="var(--active-color)" />
                    { dropdownOpen && <div className={styles.NewChat__Dropdown}>
                        <div className={styles.NewChat__Dropdown__Header}>
                            <Input placeholder="Search or create a group" value={inputText} onChange={(e) => {
                                setInputText(e.target.value);
                            }} />
                        </div>
                        <div className={styles.NewChat__Dropdown__Results}>
                            <p style={{
                                width: "-webkit-fill-available",
                                textAlign: "center",
                                color: "var(--tertiary-text-color)"
                            }}>no results</p>
        
                            
                        </div>
                    </div>}
                </>
            }
            
        </Button>
    )
}