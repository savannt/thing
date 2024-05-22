import styles from "@/app/Chat/ChatGraph/NodeTypes/NodeTypes.module.css"

import { Handle } from "reactflow"

export default function Node ({ color=[200, 200, 200], left = false, right = false, inputExecution = true, outputExecution = true, className, data, children }) {
    console.log("DATA", data);
    
    const semiTransparentColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.2)`
    return (
        <div className={`${styles.Node} ${className} ${data.deleting ? "deleting" : ""}`} style={{
            border: `2px solid ${semiTransparentColor}`
        }}>
            <div className={`${styles.Node__Header} ${!left ? "" : styles.Node__Header__NoLeft}`} style={{
                background: semiTransparentColor
            }}>
                { inputExecution && <Handle type="target" position="left" id="execution" />}
                <h1>{data.label}</h1>
                <h2>{data.details}</h2>
                { outputExecution && <Handle type="source" position="right" id="execution" />}
            </div>

            <div className={`${styles.Node__Outputs} ${left ? styles.Node__Outputs__Left : ""} ${right ? styles.Node__Outputs__Right : ""}`}>
                { children }
            </div>
       </div>
    )
}