import styles from "@/components/ColorImage/ColorImage.module.css";

export default function ColorImage ({ show = true, visible = true, size = false, aspectRatio, image, color = "var(--primary-text-color)", className }) {
	if(!show) return null;
	return (
		<div className={`${styles.ColorImage} ${className}`} style={{
			WebkitMaskImage: `url(${image})`,
			WebkitMaskSize: "contain",
			WebkitMaskRepeat: "no-repeat",
			WebkitMaskPosition: "center",
			backgroundColor: color,

			aspectRatio: aspectRatio ? aspectRatio : "unset",

			visibility: visible ? "inherit" : "hidden",

			width: size ? size : "",
			height: size ? size : ""
		}}></div>
	)
}