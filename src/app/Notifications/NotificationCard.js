import "animate.css";
import styles from "@/app/Notifications/Notifications.module.css";

import ColorImage from "@/components/ColorImage/ColorImage";
import { useEffect, useState } from "react";

export default function NotificationCard ({ imageSize=10, image = "/images/icons/dot.png", color = "var(--action-color)", children, timeout = 5000, onTimeout }) {
    const ANIMATION_DURATION = 500;

    const [isHidden, setIsHidden] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsHidden(true);

            setTimeout(() => {
                if(onTimeout) {
                    onTimeout();
                }
            }, ANIMATION_DURATION);
        }, timeout);

        return () => {
            clearTimeout(timer);
        }
    }, [timeout, onTimeout]);

    return (
        <div className={`animate__animated ${isHidden ? "animate__fadeOutDown" : "animate__fadeInUp"} ${styles.NotificationCard}`}>
            { image && <ColorImage size={imageSize} className={styles.NotificationCard__Image} image={image} color={color} /> }
            <div className={styles.NotificationCard__Content}>
                { children }
            </div>
        </div>
    )
}