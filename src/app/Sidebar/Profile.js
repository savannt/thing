import styles from "@/app/Sidebar/Profile.module.css";

import { useUser, UserButton, OrganizationSwitcher } from "@clerk/nextjs";

export default function Profile () {
    const { user } = useUser();

    const displayName = "Guest";
    const description = "";

    return (
        <>
            <OrganizationSwitcher />
            <div className={styles.Profile} onClick={() => {
                document.querySelector(".cl-userButton-root").click();
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