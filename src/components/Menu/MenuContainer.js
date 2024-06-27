import styles from "@/components/Menu/Menu.module.css"

import { useEffect, useRef } from "react"

export default function MenuContainer ({ className, style, onClick, children }) {
	const ref = useRef(null);

	useEffect(() => {
		// bind mouse down so we can catch up arrow and down arrow- if up or down, move focus to next tab
		const handleKeyDown = (e) => {
			if (e.key === "ArrowDown" || e.key === "ArrowUp") {
				// get all children with tab index
				const items = ref.current.querySelectorAll("[tabindex]");
				// get the current active element
				const activeElement = document.activeElement;
				// get the index of the active element
				const index = Array.from(items).indexOf(activeElement);
				// if the active element is not in the list, set the index to -1
				const nextIndex = index === -1 ? 0 : index + (e.key === "ArrowDown" ? 1 : -1);
				// if the next index is out of bounds, set it to the first or last index
				const nextElement = items[nextIndex < 0 ? items.length - 1 : nextIndex % items.length];
				// focus the next element
				nextElement.focus();
				e.preventDefault();
			}
			// if enter
			if (e.key === "Enter") {
				const activeElement = document.activeElement;
				if(activeElement) {
					activeElement.click();
				}
			}
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		}
	}, []);

	return (
		<div ref={ref} className={`${styles.MenuContainer} ${className}`} style={style} onClick={onClick} >
			{children}
		</div>
	)
}