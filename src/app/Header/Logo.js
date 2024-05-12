import styles from "@/app/Header/Logo.module.css";

export default function Logo({ className, scale = "1", onClick, style = {} }) {
    return (
        <div className={`${styles.Logo} ${className}`} onClick={onClick} style={{
            scale,
            ...style
        }}>
            <h1>thing</h1><h2>king</h2>
        </div>
    )
}