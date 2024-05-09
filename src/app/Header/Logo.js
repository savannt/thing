import styles from "@/app/Header/Logo.module.css";

export default function Logo({ scale = "1", style = {} }) {
    return (
        <div className={styles.Logo} style={{
            scale,
            ...style
        }}>
            <h1>thing</h1><h2>king</h2>
        </div>
    )
}