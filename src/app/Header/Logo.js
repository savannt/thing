import styles from "@/app/Header/Logo.module.css";

export default function Logo({ scale = "1" }) {
    return (
        <div className={styles.Logo} style={{
            scale
        }}>
            <h1>thing</h1><h2>king</h2>
        </div>
    )
}