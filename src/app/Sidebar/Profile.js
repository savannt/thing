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
            }}>
                <UserButton />
                <div>
                    <h1>{displayName}</h1>
                    { description && <p>{description}</p> }
                </div>
            </div>
        </>
    )
}