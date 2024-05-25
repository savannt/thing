import styles from "@/app/Chat/ChatInput/ChatInput.module.css"

import Input from "@/components/Input/Input"
import SquareButton from "@/components/Button/SquareButton";

import { createRef } from "react";

export default function ChatInput ({ allowSend, inputText, inputRows, onChange, onKeyPress, onKeyDown, onKeyUp, onFileChange, onSend }) {
    const fileInputRef = createRef();

    return (
        <>
            <Input hiddenFocus={!allowSend} textarea={true} placeholder="Send a message" value={inputText} rows={inputRows} onChange={onChange} onKeyPress={onKeyPress} onKeyDown={onKeyDown} onKeyUp={onKeyUp} >
                <input ref={fileInputRef} style={{ display: "none" }} type="file" id="file" accept="image/*" onChange={onFileChange}/>
                <SquareButton className={styles.ChatInput__Attachment} image="/images/icons/upload.png" background={false} color="var(--secondary-text-color)" onClick={() => {
                    if(fileInputRef.current) fileInputRef.current.click();
                }}/>
            </Input>
            <SquareButton id="send" image="/images/icons/send.png" color={allowSend ? "white" : "var(--primary-text-color)"} background={allowSend ? "var(--action-color)" : "var(--disabled-color)"} disabled={!allowSend} onClick={() => { if(onSend) onSend() }}/>
        </>
    )
}