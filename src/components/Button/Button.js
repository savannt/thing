import styles from "@/components/Button/Button.module.css";

import ColorImage from "@/components/ColorImage/ColorImage";

export default function Button ({ overflow = "hidden", ref, aspectRatio, aria = false, id, disabled = false, text, image, background = "var(--secondary-color)", color = "var(--primary-text-color)", width, className, children, onClick, paddingRight }) {
	return (
		aria ? <div id={id} tabIndex={0} role="button" aria-pressed={false} disabled={disabled} className={`${className} ${styles.Button} ${disabled ? styles.Button__Disabled : ""}`} onClick={(...e) => {
			if(disabled) return;
			if(onClick) onClick(...e);
		}} style={{
			backgroundColor: background ? background : "transparent",
			color,
			width: width ? width : "auto",
			paddingRight: paddingRight,
			aspectRatio: aspectRatio ? aspectRatio : "unset",
			overflow
		}}>
			{ image && <ColorImage aspectRatio="1/1" image={image} color={color} />}
			{ text && <p style={{
				fontSize: "85%",
				fontWeight: "500",
				color,
				whiteSpace: "normal",
				overflow: "hidden",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center"
			}}>{text}</p>}
			{ children }
		</div> : <button id={id} disabled={disabled} className={`${className} ${styles.Button} ${disabled ? styles.Button__Disabled : ""}`} onClick={(...e) => {
			if(disabled) return;
			if(onClick) onClick(...e);
		}} style={{
			backgroundColor: background ? background : "transparent",
			color: color,
			width: width ? width : "auto",
			paddingRight: paddingRight,
			aspectRatio: aspectRatio ? aspectRatio : "unset",
			overflow
		}}>
			{ image && <ColorImage aspectRatio="1/1" image={image} color={color} />}
			{ text && <p style={{
				fontSize: "85%",
				fontWeight: "500",
				color,
				whiteSpace: "normal",
				overflow: "hidden",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center"
			}}>{text}</p>}
			{ children }
		</button>
	)
}