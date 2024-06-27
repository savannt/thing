import styles from "@/app/Chat/ChatGraph/Flow/ValueTypes/ValueTypes.module.css"

import Value from "@/app/Chat/ChatGraph/Flow/ValueTypes/Value"

import Input from "@/components/Input/Input"

import { useState, useEffect } from "react"
import TYPES from "@/app/Chat/ChatGraph/Flow/Types"



export default function InputValue ({ onChange, data, inputType = "text" }) {

    const [isConnected, setIsConnected] = useState(false);

    let showInput = true;
    if(data.input && isConnected) showInput = false;


    // generate color of input based on type
    let color = [200, 200, 200];
    if(data.type) {
        const typeData = TYPES[data.type];
        if(typeData && typeData.color) color = typeData.color;
    }
    
    let colorRgba = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.2)`;
    colorRgba = false;

    return (
        <Value data={data} onConnect={() => setIsConnected(true)} fullWidth={true}>
            <Input color={colorRgba} className={`${styles.InputValue} ${styles.Input}`} type={inputType} value={data.value || ""} onChange={(e) => {
                const value = e.target.value;
                if(onChange) onChange(value);
            }} />
        </Value>
    )
}