import styles from "@/app/Header/Header.module.css";

import Logo from "@/app/Header/Logo";
import SquareButton from "@/components/Button/SquareButton";


export default function Header ({ group, chat, onBack, onLogout }) {
    return (
        <div id="header" className={styles.Header}>
            <div className={styles.Header__Start}>
                {
                    group ? <>
                        <SquareButton image="/images/icons/caret/caret_left.svg" onClick={() => onBack()} />
                        <h1 className={styles.Header__Title}>{(group?.name || "group")} / {(chat?.name) || "chat"}</h1>
                    </> : <>
                        <Logo />
                    </>
                }
            </div>
            <div className={styles.Header__End}>
                <SquareButton image="/images/icons/ic_theme.svg" onClick={() => {
                    // toggle data-theme from light to dark
                    document.documentElement.setAttribute("data-theme", document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light")
                }}/>
                <SquareButton image="/images/icons/logout.svg" color="var(--red)" onClick={() => onLogout()}/>
            </div>
        </div>
    )
}