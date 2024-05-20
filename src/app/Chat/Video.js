import styles from "@/app/Chat/Video.module.css"

import error from "@/client/error";
import notification from "@/client/notification";

import { useEffect, useRef } from "react"

export default function Video ({ className, onAnimationEnd , onBack }) {
    const videoRef = useRef(null);

    useEffect(() => {
        const getCameraFeed = async () => {
            try {
                // first get
                if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    console.error("No navigator.mediaDevices.getUserMedia");
                    notification("Unsupported Browser", "Your browser does not support video chat. Please use a different browser.", "red");

                    onBack();
                    return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if(!videoRef || !videoRef.current) {
                    console.error("Video component has no videoRef");
                    error("Video component has no videoRef");

                    onBack();
                    return;
                } else {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                // if error is "Requested device not found"

                if(err.name === "NotFoundError") {
                    notification("Live video chat failed", "No camera detected", "red");
                } else {
                    fetch("/api/test", {
                        method: "POST",
                        body: JSON.stringify({
                            message: "Error getting camera feed",
                            error: err.message,
                            name: err.name
                        })
                    })
                    console.error("Error getting camera feed", err.message, err.name);
                    error("Error getting camera feed");
                }

                onBack();
            }
        }

        getCameraFeed();

        return () => {
            if(videoRef && videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject;
                const tracks = stream.getTracks();

                tracks.forEach(track => {
                    track.stop();
                });
            }
        }
    }, []);

    return (
        <div className={`${styles.Video} ${className}`} onAnimationEnd={onAnimationEnd}>
            <video className={styles.Video__Video} id="video" ref={videoRef} autoPlay playsInline />
        </div>
    );
}