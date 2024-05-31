import styles from "@/components/Menu/Menu.module.css"

export default function MenuContainer ({ className, style, onClick, children }) {
		return (
				<div className={`${styles.MenuContainer} ${className}`} style={style} onClick={onClick} >
						{children}
				</div>
		)
}