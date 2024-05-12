import styles from "@/components/ColorImage/ColorImage.module.css";

export default function ColorImage ({ size = false, aspectRatio, image, color = "var(--primary-text-color)", className }) {
    return (
        <div className={`${styles.ColorImage} ${className}`} style={{
            WebkitMaskImage: `url(${image})`,
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            backgroundColor: color,

            aspectRatio: aspectRatio ? aspectRatio : "unset",

            width: size ? size : "",
            height: size ? size : ""
        }}></div>
    )
}