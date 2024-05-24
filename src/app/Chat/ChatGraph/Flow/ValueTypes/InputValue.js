import styles from "@/app/Chat/ChatGraph/Flow/ValueTypes/ValueTypes.module.css"

import Value from "@/app/Chat/ChatGraph/Flow/ValueTypes/Value"

import Input from "@/components/Input/Input"

import { useState, useEffect } from "react"

export default function InputValue ({ data, value, inputType = "text" }) {
    const [inputValue, setInputValue] = useState(value)

    return (
        <Value data={data}>
            <Input className={styles.Input} type={inputType} value={inputValue} onChange={(e) => {
                setInputValue(e.target.value);
            }} />
        </Value>
    )
}