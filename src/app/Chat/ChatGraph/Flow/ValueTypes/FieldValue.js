import styles from "@/app/Chat/ChatGraph/Flow/ValueTypes/ValueTypes.module.css"

import Value from "@/app/Chat/ChatGraph/Flow/ValueTypes/Value"

export default function FieldValue ({ data={data}, style, fullWidth }) {
    return (
        <Value data={data} style={style} fullWidth={fullWidth} />
    )
}