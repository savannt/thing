import styles from "@/components/Button/Button.module.css";

import ColorImage from "@/components/ColorImage/ColorImage";

export default function Button ({ ref, aria = false, id, disabled = false, text, image, background = "var(--secondary-color)", color = "var(--primary-text-color)", width, className, children, onClick, paddingRight }) {
    return (
        aria ? <div id={id} tabIndex={0} role="button" aria-pressed={false} disabled={disabled} className={`${className} ${styles.Button}`} onClick={(...e) => {
            if(disabled) return;
            if(onClick) onClick(...e);
        }} style={{
            backgroundColor: background ? background : "transparent",
            color,
            width: width ? width : "auto",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            paddingRight: paddingRight
        }}>
            { image && <ColorImage aspectRatio="1/1" image={image} color={color} />}
            { text && <p style={{
                fontSize: "105%",
                fontWeight: "500",
                color
            }}>{text}</p>}
            { children }
        </div> : <button id={id} disabled={disabled} className={`${className} ${styles.Button}`} onClick={(...e) => {
            if(disabled) return;
            if(onClick) onClick(...e);
        }} style={{
            backgroundColor: background ? background : "transparent",
            color: color,
            width: width ? width : "auto",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            paddingRight: paddingRight
        }}>
            { image && <ColorImage aspectRatio="1/1" image={image} color={color} />}
            { text && <p style={{
                fontSize: "105%",
                fontWeight: "500",
                color
            }}>{text}</p>}
            { children }
        </button>
    )
}