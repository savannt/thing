import styles from "@/components/Input/Input.module.css";

import ColorImage from "@/components/ColorImage/ColorImage"

export default function Input ({ color = false, type, doAutoFocus = false, hiddenFocus = false, textarea = false, image, className, placeholder, value, onChange, onKeyPress, onKeyDown, onKeyUp, onClick, rows, children }) {
	if((!value || value.length === 0) && !hiddenFocus) hiddenFocus = true;
	if(type === "textarea") {
		textarea = true;
		type = undefined;
	}

	let style = {};
	// if(color) style.border = "1px solid " + color;
	// instead of changing border- lets use box-shadow so we get box border, outline, and a outline-shadow
	// if(color) style.boxShadow = `0px 0px 0px 1px ${color}`;
	// but give it some gap
	if(color) style.boxShadow = `0px 0px 0px 0px var(--background-color), 0px 0px 0px 1px ${color}`;

	return (
		<div className={`${styles.Input} ${className}`}>
			{ image && <ColorImage color="var(--secondary-text-color)" image={image} aspectRatio="1/1" /> }
			{ textarea ?
				<textarea
					type={type}
					placeholder={placeholder}
					value={value}
					onChange={onChange}
					onClick={onClick}
					rows={rows}
					onKeyPress={onKeyPress}
					className={hiddenFocus ? styles.Input__HiddenFocus : ""}

					onKeyDown={onKeyDown}
					onKeyUp={onKeyUp}

					autoFocus={doAutoFocus}
					style={style}
				/> : 
				<input
					type={type}
					placeholder={placeholder}
					value={value}
					onChange={onChange}
					onClick={onClick}
					onKeyPress={onKeyPress}
					className={hiddenFocus ? styles.Input__HiddenFocus : ""}

					onKeyDown={onKeyDown}
					onKeyUp={onKeyUp}

					autoFocus={doAutoFocus}
					style={style}
				/>
			}
			{ children }
		</div>
	)
}