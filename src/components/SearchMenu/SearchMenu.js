import styles from "@/components/SearchMenu/SearchMenu.module.css"

import Input from "@/components/Input/Input"

import SquareButton from "@/components/Button/SquareButton"
import ColorImage from "@/components/ColorImage/ColorImage"

export function SearchMenuRow ({ disabled = false, id, image, text, onClick, showDelete = false, onDelete }) {
    return (
        <div id={id} className={styles.SearchMenu__Row} onClick={(...e) => {
            if(disabled) return;
            if(onClick) onClick(...e);
        }} tabIndex={1} role="button" aria-pressed={false} style={{
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1
        }}>
            { image && <ColorImage image={image} color="var(--secondary-text-color)" /> }
            <p>{text}</p>

            { showDelete && <SquareButton className={styles.SearchMenu__Row__Delete} onClick={(e) => {
                if(onDelete) onDelete();
                e.stopPropagation();
            }} image="/images/icons/trash.svg" color="var(--red)" background={false} /> }
        </div>
    )
}

export default function SearchMenu ({ className, placeholder, hasResults = false, noResultsText = "no results", id, inputText, setInputText, children }) {
    return (
        <div id={id} className={`${styles.SearchMenu} ${className}`} onClick={(e) => e.stopPropagation() }>
            <div className={styles.SearchMenu__Header}>
                <Input doAutoFocus={true} placeholder={placeholder} value={inputText} onChange={(e) => {
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
            <div className={styles.SearchMenu__Results}>
                {
                    !hasResults && <p style={{
                        width: "-webkit-fill-available",
                        textAlign: "center",
                        color: "var(--tertiary-text-color)"
                    }}>{noResultsText}</p>
                }

                { children }
            </div>
        </div>
    )
}