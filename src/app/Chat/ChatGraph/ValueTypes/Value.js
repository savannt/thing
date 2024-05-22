import styles from "@/app/Chat/ChatGraph/ValueTypes/ValueTypes.module.css"

import { Handle } from "reactflow";

export default function Value ({ type, input = false, output = false, children }) {
    return (
        <div className={styles.Value}>
            { input && <Handle type="target" position="left" id={type} />}
            { children }
            { output && <Handle type="source" position="right" id={type} />}
        </div>
    )
}