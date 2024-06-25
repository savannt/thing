import styles from "@/app/Chat/ChatGraph/Flow/ValueTypes/ValueTypes.module.css"

import Value from "@/app/Chat/ChatGraph/Flow/ValueTypes/Value"

import Input from "@/components/Input/Input"

import { useState, useEffect } from "react"

export default function InputValue ({ onChange, data, inputType = "text" }) {

    return (
        <Value data={data}>
            <Input className={styles.Input} type={inputType} value={data.value || ""} onChange={(e) => {
                const value = e.target.value;
                if(onChange) onChange(value);
            }} />
        </Value>
    )
}