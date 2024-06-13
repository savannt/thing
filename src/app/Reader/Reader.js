import styles from "@/app/Reader/Reader.module.css";

import Header from "@/app/Header/Header";
import { useRouter } from "next/router";

export default function Reader ({ inlinePadding = "calc(4 * var(--margin-inline))", blockPadding = "var(--margin-block)", header = false, children }) {
    const router = useRouter();
    Fixed 
    const style = {
        height: header ? `calc(100dvh - var(--header-height) - (2 * ${blockPadding}))` : "100dvh",
        maxHeight: header ? `calc(100dvh - var(--header-height) - (2 * ${blockPadding}))` : "100dvh",
        marginInline: inlinePadding ? inlinePadding : undefined,
        marginBlock: blockPadding ? blockPadding : undefined
    };

    const onHome = () => { router.push("/"); }

    return (
        <div className={styles.Reader}>
            {
                header && <Header showBack={true} inlinePadding={inlinePadding} onHome={onHome} onBack={onHome} />
            }
            <div className={styles.Reader__ContentOutside} style={style}>
                <div className={styles.Reader__Content}>
                    { children }
                </div>
                <div className={styles.Reader__Content__Overlay}></div>
            </div>
        </div>
    )
}