import styles from "@/components/Dropdown/Dropdown.module.css";

import ColorImage from "@/components/ColorImage/ColorImage"

export default function Dropdown ({ color = false, values, doAutoFocus = false, image, className, placeholder, value, onChange, onKeyPress, onKeyDown, onKeyUp, onClick, rows, children }) {
	let style = {};
	// if(color) style.border = "1px solid " + color;
	// instead of changing border- lets use box-shadow so we get box border, outline, and a outline-shadow
	// if(color) style.boxShadow = `0px 0px 0px 1px ${color}`;
	// but give it some gap
	if(color) style.boxShadow = `0px 0px 0px 0px var(--background-color), 0px 0px 0px 1px ${color}`;

	return (
		<div className={`${styles.Dropdown} ${className}`}>
			{ image && <ColorImage color="var(--secondary-text-color)" image={image} aspectRatio="1/1" /> }
			<select
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				onClick={onClick}
				onKeyPress={onKeyPress}
				className={styles.Dropdown__Select}
				
				onKeyDown={onKeyDown}
				onKeyUp={onKeyUp}
				
				autoFocus={doAutoFocus}
				style={style}
			>
				{ values.map((value, index) => (
					<option key={index} value={value}>{ value }</option>
				)) }
			</select>
			{ children }
		</div>
	)
}