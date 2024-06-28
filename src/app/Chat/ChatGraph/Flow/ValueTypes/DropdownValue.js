import styles from "@/app/Chat/ChatGraph/Flow/ValueTypes/ValueTypes.module.css"

import Value from "@/app/Chat/ChatGraph/Flow/ValueTypes/Value"

import Dropdown from "@/components/Dropdown/Dropdown"

import { useState, useEffect } from "react"
import TYPES from "@/app/Chat/ChatGraph/Flow/Types"
import { DataArrayTexture } from "three"



import { isType, getValidValues } from "@/services/flow/node/services/Types";

export default function DropdownValue ({ onChange, data }) {

    let showDropdown = true;
    const isConnected = data._connected || false;
    if(data.input && isConnected) showDropdown = false;


    // generate color of input based on type
    let color = [200, 200, 200];
    if(data.type) {
        const typeData = TYPES[data.type];
        if(typeData && typeData.color) color = typeData.color;
    }
    
    let colorRgba = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.2)`;
    colorRgba = false;



    let values = data.values || [];
    if(!data.values && isType(data.type)) {
        const validValues = getValidValues(data.type);
        if(validValues) values = validValues;
    }

    


    if(values.length > 0) {
        // put " " at start of values
        values.unshift(" ");
    }


    return (
        <Value data={data} fullWidth={true}>
            {
                values && values.length > 0 && showDropdown && <Dropdown values={values} color={colorRgba} className={`${styles.InputValue} ${styles.Input}`} value={data.value || false} onChange={(e) => {
                    const value = e.target.value;
                    if(onChange) {
                        if(value === " ") onChange(false);
                        else onChange(value);
                    }
                }} />
            }
        </Value>
    )
}