import styles from "@/app/Chat/ChatGraph/Flow/ValueTypes/ValueTypes.module.css"

import { Handle } from "reactflow";

import { useEffect, useState } from "react";

import TYPES from "@/app/Chat/ChatGraph/Flow/Types"

import {
    DEFAULT_INPUTS_REQUIRED,
    DEFAULT_OUTPUTS_REQUIRED
} from "@/services/flow/client/ValueConstants"


export default function Value ({ data, style, fullWidth = false, children, onConnect }) {
    if(!data) return null;
    let {
        name,
        type,
        description,
        value = false,
        input = false,
        output = false,
        required,
        constant = false,
        _onConnected = false
    } = data;
    const title = name;
    if(typeof required === "undefined") {
        if(input) required = DEFAULT_INPUTS_REQUIRED;
        if(output) required = DEFAULT_OUTPUTS_REQUIRED;
    }
    const isConnected = data._connected || false;

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


    const [showTooltip, setShowTooltip] = useState(false);

    const [hasTargetConnection, setHasTargetConnection] = useState(_onConnected && input)
    const [hasSourceConnection, setHasSourceConnection] = useState(_onConnected && output)

    useEffect(() => {
        if(input && typeof data._onConnected !== "undefined") setHasTargetConnection(data._onConnected);
        if(output && typeof data._onConnected !== "undefined") setHasSourceConnection(data._onConnected);
        
    }, [data._onConnected, data.input, data.output]);

    const onTargetConnect = (e) => {
        console.log("CONNECT", e);
        setHasTargetConnection(true);

        if(onConnect) onConnect(e);
    }

    const onSourceConnection = (e) => {
        setHasSourceConnection(true);

        if(onConnect) onConnect(e);
    }

    const isOptional = data.optional || required === false || false;
    handleStyle.opacity = isOptional ? 0.5 : 1


    // if we are a input, with value, and _onChange- disable the handle

    let isConnectable = true;
    let isConnectableStart = true;
    let isConnecteableEnd = true;
    
    let textStyle = {};
    let hideHandle = false;

    if(input && value && data._onChange) {
        isConnectable = false;
        isConnectableStart = false;
        isConnecteableEnd = false;

        handleStyle.opacity = 0.3;
        handleStyle.cursor = "not-allowed";
        textStyle.opacity = 1;
        // italic textStyle
        textStyle.fontStyle = "italic";
        textStyle.opacity = 0.7;
    }

    // if we are required- and we have no connections- make the textStyle underlined
    if(input && required !== false) {
        if(!value) {
            if(constant) textStyle.textDecoration = "underline";
            if(!data._connected) textStyle.textDecoration = "underline";
        }
    }
    if(input && value) hideHandle = true;

    if(output && required !== false) {
        if(constant && !value) textStyle.textDecoration = "underline";
        if(!data._connected) textStyle.textDecoration = "underline";
    }

    if(value || hasSourceConnection || hasTargetConnection || isConnected) {
        handleStyle.opacity = 1;
        textStyle.opacity = 1;
    }
    if(hideHandle) {
        handleStyle.opacity = 0;
        textStyle.marginLeft = "calc(-1 * var(--halfGap))"
    
        isConnectable = false;
        isConnectableStart = false;
        isConnecteableEnd = false;
    }

    if(!style) style = {};
    return (
        <div className={`${styles.Value} ${input ? styles.Value__Input : ""} ${output ? styles.Value__Output : ""}`} style={{
            ...style,
            maxWidth: fullWidth ? "100%" : "fit-content"
        }} >
            <div className={styles.Value__Header} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                { input && <Handle isConnectable={isConnectable} isConnectableStart={isConnectableStart} isConnectableEnd={isConnecteableEnd} type="target" position="left" id={`${type}:${name}`} style={handleStyle} onConnect={onTargetConnect} />}


                {
                    name && <p style={{
                        textAlign: data.input ? "left" : "right",
                        color: hasTargetConnection || hasSourceConnection ? secondaryColor : tertiaryColor,
                        // make italic
                        fontStyle: isOptional ? "italic" : "normal",
                        opacity: isOptional ? 0.5 : 1,

                        ...textStyle
                    }}>{data.name || "unknown"}</p>
                }

                { showTooltip && <div className={styles.Value__Header__Tooltip}>
                    <p style={{ color: primaryColor }}>{type}</p>
                    <p>{description || "No description available"}</p>
                    { isOptional && <p><b>Optional</b></p>}
                </div> }


                { output && <Handle isConnectable={isConnectable} isConnectableStart={isConnectableStart} isConnectableEnd={isConnecteableEnd} type="source" position="right" id={`${type}:${name}`} style={handleStyle} onConnect={onSourceConnection} />}
            </div>
            <div className={styles.Value__Content}>
                { children }
            </div>
        </div>
    )
}