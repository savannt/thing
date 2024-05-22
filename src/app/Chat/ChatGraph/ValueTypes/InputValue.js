import styles from "@/app/Chat/ChatGraph/ValueTypes/ValueTypes.module.css"

import Value from "@/app/Chat/ChatGraph/ValueTypes/Value"

import Input from "@/components/Input/Input"

import { useState, useEffect } from "react"

export default function InputValue ({ type, input, output, value, inputType }) {
    const [inputValue, setInputValue] = useState(value)

    return (
        <Value type={type} input={input} output={output}>
            <Input className={styles.Input} type={inputType} value={inputValue} onChange={(e) => {
                setInputValue(e.target.value);
            }} />
        </Value>
    )
}