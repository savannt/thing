import styles from "@/components/Button/Button.module.css";

import Button from "@/components/Button/Button";
import ColorImage from "@/components/ColorImage/ColorImage";

export default function SquareButton ({ id, disabled, background, color, className, onClick, image }) {
    return (
        <Button aspectRatio="1/1" id={id} disabled={disabled} className={`${className} ${styles.SquareButton}`} onClick={onClick} background={background}>
            <ColorImage aspectRatio="1/1" color={color} image={image} alt="icon" />
        </Button>
    )
}