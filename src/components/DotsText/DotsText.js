import styles from "@/components/DotsText/DotsText.module.css";
import ColorImage from "@/components/ColorImage/ColorImage";

export default function DotsText ({ color = "var(--primary-text-color)", className, children }) {
    return (
        <div className={`${styles.Dots} ${className}`}>
            { children }
            <ColorImage className={styles.Dot} image={"/gifs/dots.gif"} color={color} />
        </div>
    )
}