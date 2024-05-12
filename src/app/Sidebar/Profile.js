import styles from "@/app/Sidebar/Profile.module.css";

import { useUser, UserButton, OrganizationSwitcher } from "@clerk/nextjs";

export default function Profile ({ onLogout }) {
    const { user } = useUser();

    const displayName = "Guest";
    const description = "";

    return (
        <>
            <OrganizationSwitcher />
            <div className={styles.Profile} onClick={() => {
                if(document.querySelector(".cl-userButton-popover")) document.querySelector("body").click();
                else if(document.querySelector(".cl-userButtonTrigger")) document.querySelector(".cl-userButtonTrigger").click()
                else onLogout();
            }} onMouseEnter={() => {
                // send mouseenter event to .cl-userButton-root
                const target = document.querySelector(".cl-userButton-root button");
                const event = new MouseEvent("mouseenter", {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                target.dispatchEvent(event);
            }} onMouseLeave={() => {
                // send mouseleave event to .cl-userButton-root
                const target = document.querySelector(".cl-userButton-root button");
                const event = new MouseEvent("mouseleave", {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                target.dispatchEvent(event);
            }} >
                <UserButton />
                <div>
                    <h1>{displayName}</h1>
                    { description && <p>{description}</p> }
                </div>
            </div>
        </>
    )
}