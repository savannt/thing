import "animate.css"
import styles from "@/app/Chat/ChatGraph/SaveIcon/SaveIcon.module.css"
import ColorImage from "@/components/ColorImage/ColorImage"

export default function SaveIcon ({ saving = false, saved = false }) {
    if(saved) return null;
    return (
        <div className={styles.SaveIcon}>
            <ColorImage show={saving && !saved}  className={styles.SaveIcon__Saving}  image={"/gifs/loading5.gif"} />
            <ColorImage show={!saving && !saved} className={styles.SaveIcon__Waiting} image={"/gifs/loading15.gif"} />
            {/* <p>saving</p> */}
        </div>
    )
}