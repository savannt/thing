import styles from "@/app/Chat/ChatGraph/NodeTypes/NodeTypes.module.css"

import { Handle } from "reactflow";

import Node from "@/app/Chat/ChatGraph/NodeTypes/Node"

import FieldValue from "@/app/Chat/ChatGraph/ValueTypes/FieldValue";
import InputValue from "../ValueTypes/InputValue";

export default function ConstantNode ({ data }) {
    return (
        <Node color={[0, 0, 0]} left={true} inputExecution={false} outputExecution={false} className={styles.VerticalNode} data={data}>
            { data.value && (data.valueType === "string" || data.valueType === "number" || data.valueType === "textarea") && <InputValue input={false} output={true} value={data.value} inputType={data.valueType} /> }
        </Node>
    )
}