import styles from "@/components/Input/Input.module.css";

import ColorImage from "@/components/ColorImage/ColorImage"

export default function Input ({ hiddenFocus = false, textarea = false, image, className, placeholder, value, onChange, onKeyPress, onKeyDown, onKeyUp, onClick, rows, children }) {
    if((!value || value.length === 0) && !hiddenFocus) hiddenFocus = true;
    
    return (
        <div className={`${styles.Input} ${className}`}>
            { image && <ColorImage color="var(--secondary-text-color)" image={image} aspectRatio="1/1" /> }
            { textarea ?
                <textarea
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onClick={onClick}
                    rows={rows}
                    onKeyPress={onKeyPress}
                    className={hiddenFocus ? styles.Input__HiddenFocus : ""}

                    onKeyDown={onKeyDown}
                    onKeyUp={onKeyUp}

                    autoFocus
                /> : 
                <input
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onClick={onClick}
                    onKeyPress={onKeyPress}
                    className={hiddenFocus ? styles.Input__HiddenFocus : ""}

                    onKeyDown={onKeyDown}
                    onKeyUp={onKeyUp}

                    autoFocus
                />
            }
            { children }
        </div>
    )
}