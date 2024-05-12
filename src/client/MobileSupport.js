import {signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

import Button from "@/components/Button/Button";
import ThemedIcon from "@/components/ThemedIcon/ThemedIcon";
import useMobile from "@/providers/Mobile/useMobile";

export default function MobileSupport () {
    const isMobile = useMobile();

    useEffect(() => {
        // document.addEventListener("touchmove", function (e) {
        //     e.preventDefault();
        // });
        // document.ontouchmove = function (e) {
        //     e.preventDefault();
        // }
        // document.addEventListener("gesturestart", function (e) {
        //     e.preventDefault();
        // })

        // let timeout = 1000;
        // let hasTimeout = false;
        // document.addEventListener("scroll", function (e) {
        //     // e.preventDefault();
            
        //     if(hasTimeout) clearTimeout(hasTimeout);
        //     hasTimeout = setTimeout(() => {
        //         // scrollTo(0, 1);
        //         hasTimeout = false;
        //     }, timeout);
        // });
    })

    function AbsoluteLayer ({ style = {}, children }) {

        style.position = "absolute";
        style.width = "100vw";
        style.height = "100dvh";
        style.zIndex = "10000";


        return (
            <div style={style}>
                {children}
            </div>
        )
    }


    let [opener, setOpener] = useState(false);
    let [hasSeenSuggestions, setHasSeenSuggestions] = useState(true);

    useEffect(() => {
        if(window && parent)  {
            if(isMobile) {
                // if we are not in a web app
                const uagent = navigator.userAgent;
                if (uagent.match(/Android/i) || uagent.match(/webOS/i) || uagent.match(/iPhone/i) || uagent.match(/iPad/i) || uagent.match(/iPod/i) || uagent.match(/BlackBerry/i) || uagent.match(/Windows Phone/i)) {
                    setOpener(!!window.opener || !!parent.window.opener);
                }

            }
        }

        // // and not web app
        // if(isMobile && !window.matchMedia('(display-mode: standalone)').matches) {
        //     if(document.cookie.split(";").filter((item) => item.includes("nobusiness.hasSeenSuggestions=true")).length) {
        //         setHasSeenSuggestions(true);
        //     } else {
        //         if(width < 700) setHasSeenSuggestions(false);
        //     }

        // }
    }, [isMobile]);

    return (
        <>
            { opener &&
                <AbsoluteLayer style={{
                    backgroundColor: "var(--card-background-color)",

                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "15px",
                }}>
                    <h1 style={{ fontSize: "10vw", color: "var(--card-primary-text-color)"}}>Welcome back!</h1>
                    <p style={{ fontSize: "4vw", color: "var(--card-secondary-text-color)"}}>Close this window to continue.</p>
                </AbsoluteLayer>
            }
            {!hasSeenSuggestions &&
                <AbsoluteLayer style={{
                    backgroundColor: "var(--card-background-color)",

                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",

                        width: "80%",

                        gap: "15px",
                    }}>
                        <h1 style={{ fontSize: "10vw", color: "var(--card-primary-text-color)"}}>Greetings, Friend</h1>
                        <p style={{ fontSize: "3.8vw", color: "var(--card-secondary-text-color)", fontWeight: "500", textAlign: "center" }}>We recommend you add this site as a "Web App" to your Mobile Device for a better experience!<br/><i style={{ fontSize: "3.25vw", fontWeight: "400" }}>(this removes pesky things like the address bar)</i></p>
                        <p style={{ fontSize: "3.5vw", color: "var(--card-secondary-text-color)", textAlign: "center", marginTop: "12px" }}><i>Simply tap the "Add to Home Screen" button in your browser. If you're using an iPhone, you'll find this after tapping the share icon.</i></p>
                    </div>
                    <AbsoluteLayer style={{
                        width: "-webkit-fill-available",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "flex-start",
                        padding: "23px"
                    }}>
                        <Button hasBorder={false} hasBackground={false} width={48} height={48} style={{ backgroundColor: "transparent" }} onClick={() => {
                            // set nobusiness.hasSeenSuggestions cookie to true

                            const setCookie = (name, value, options) => {
                                options = {
                                    path: '/',
                                    // add other defaults here if necessary
                                    ...options
                                };
                                if (options.expires instanceof Date) {
                                    options.expires = options.expires.toUTCString();
                                }
                                let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
                                for (let optionKey in options) {
                                    updatedCookie += "; " + optionKey;
                                    let optionValue = options[optionKey];
                                    if (optionValue !== true) {
                                        updatedCookie += "=" + optionValue;
                                    }
                                }
                                document.cookie = updatedCookie;
                            }

                            setCookie("nobusiness.hasSeenSuggestions", "true", { expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) });

                            setHasSeenSuggestions(true);
                        }} >
                            <ThemedIcon image="/images/close.png" width={48} height={48} />
                        </Button>
                    </AbsoluteLayer>
                </AbsoluteLayer>
            }
        </>
    )
}