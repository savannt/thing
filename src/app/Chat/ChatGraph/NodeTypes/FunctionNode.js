import styles from "@/app/Chat/ChatGraph/NodeTypes/NodeTypes.module.css"

import { Handle } from "reactflow";

import Node from "@/app/Chat/ChatGraph/NodeTypes/Node"

import FieldValue from "@/app/Chat/ChatGraph/ValueTypes/FieldValue";

export default function FunctionNode ({ data }) {
    return (
        <Node color={[100, 100, 100]} inputExecution={true} outputExecution={true} className={styles.VerticalNode} data={data}>
            <FieldValue type="message" input={true} title="Message" value={data.message} />
        </Node>
    )
}