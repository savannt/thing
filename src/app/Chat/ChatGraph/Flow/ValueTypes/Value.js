import styles from "@/app/Chat/ChatGraph/Flow/ValueTypes/ValueTypes.module.css"

import { Handle } from "reactflow";

import { useState } from "react";

import TYPES from "@/app/Chat/ChatGraph/Flow/Types"

export default function Value ({ data, style, children }) {
    if(!data) return null;
    const {
        name,
        type,
        description,
        input = false,
        output = false,
    } = data;
    const title = name;


    let defaultColor = [225, 225, 225];
    const typeData = TYPES[type];

    let color = typeData && typeData.color ? typeData.color : defaultColor;
    let hasColor = typeData && typeData.color ? true : false;

    let primaryColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3)`;
    let secondaryColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`;
    let tertiaryColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`;


    const handleStyle = {
        background: "var(--hover-color)",
        border: "1px solid var(--hover-active-color)",

        right: "0px"
    }
    if(hasColor) {
        handleStyle.background = primaryColor;
        handleStyle.border = `1px solid ${secondaryColor}`;
    }

    const onMouseEnter = () => {
        setShowTooltip(true);
    }

    const onMouseLeave = () => {
        setShowTooltip(false);
    }


    const [showTooltip, setShowTooltip] = useState(false)

    const [hasTargetConnection, setHasTargetConnection] = useState(false)
    const [hasSourceConnection, setHasSourceConnection] = useState(false)

    const onTargetConnect = () => {
        setHasTargetConnection(true);
    }

    const onSourceConnection = () => {
        setHasSourceConnection(true);
    }

    return (
        <div className={`${styles.Value} ${input ? styles.Value__Input : ""} ${output ? styles.Value__Output : ""}`} style={style} >
            <div className={styles.Value__Header} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                { input && <Handle type="target" position="left" id={`${type}:${name}`} style={handleStyle} onConnect={onTargetConnect} />}
                {
                    name && <p style={{
                        textAlign: data.input ? "left" : "right",
                        color: hasTargetConnection || hasSourceConnection ? secondaryColor : tertiaryColor
                    }}>{data.name || "unknown"}</p>
                }
                { showTooltip && <div className={styles.Value__Header__Tooltip}>
                    <p style={{ color: primaryColor }}>{type}</p>
                    <p>{description || "No description available"}</p>
                </div> }
                { output && <Handle type="source" position="right" id={`${type}:${name}`} style={handleStyle} onConnect={onSourceConnection} />}
            </div>
            <div className={styles.Value__Content}>
                { children }
            </div>
        </div>
    )
}