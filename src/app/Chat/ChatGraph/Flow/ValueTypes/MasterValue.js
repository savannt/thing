import styles from "@/app/Chat/ChatGraph/Flow/ValueTypes/ValueTypes.module.css"

import { NodeGroup } from "@/app/Chat/ChatGraph/Flow/NodeTypes/Node"

import InputValue from "@/app/Chat/ChatGraph/Flow/ValueTypes/InputValue";
import FieldValue from "@/app/Chat/ChatGraph/Flow/ValueTypes/FieldValue";

export default function MasterValue ({ data, style }) {
    const {
        type,
        constant
    } = data;
    
    if(type === "group") return <NodeGroup data={data} style={style} />
    if(type === "string" && constant) return <InputValue data={data} style={style} />

    return <FieldValue data={data} style={style} />
}