import styles from "@/app/Chat/ChatGraph/ValueTypes/ValueTypes.module.css"

import Value from "@/app/Chat/ChatGraph/ValueTypes/Value"

import Input from "@/components/Input/Input"

import { useState, useEffect } from "react"

export default function FieldValue ({ type, input, output, title, value }) {
    return (
        <Value type={type} input={input} output={output} value={value}>
            <p style={{
                textAlign: input ? "left" : "right"
            }}>{title}</p>
        </Value>
    )
}