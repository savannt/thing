import styles from "@/components/Menu/Menu.module.css"

export default function Menu ({ id, className, children }) {
		return (
				<div id={id} className={`${styles.Menu} ${className}`} onClick={(e) => e.stopPropagation() } >
						{children}
				</div>
		)
}