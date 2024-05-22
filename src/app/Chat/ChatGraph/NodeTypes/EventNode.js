import styles from "@/app/Chat/ChatGraph/NodeTypes/NodeTypes.module.css"

import { Handle } from "reactflow";

import Node from "@/app/Chat/ChatGraph/NodeTypes/Node"

import FieldValue from "@/app/Chat/ChatGraph/ValueTypes/FieldValue";

export default function EventNode ({ data }) {
    
    return (
        <Node color={[200, 200, 255]} left={true} inputExecution={false} className={styles.VerticalNode} data={data}>

            <FieldValue type="message" output={true} title="Message" value={data.message} />
            <FieldValue type="array" output={true} title="File Attachments" value={data.attachments} />
        </Node>
    )
}