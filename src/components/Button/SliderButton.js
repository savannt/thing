import styles from "@/components/Button/Button.module.css"

import Button from "@/components/Button/Button"

export default function SliderButton ({ text, minText, maxText, min, max, value, onChange }) {
    return (
        <Button className={styles.SliderButton}>
            {minText && <p>{minText}</p>}
            <input type="range" min={min} max={max} value={value} onChange={onChange}/>
            {maxText && <p>{maxText}</p>}
        </Button>
    )
}