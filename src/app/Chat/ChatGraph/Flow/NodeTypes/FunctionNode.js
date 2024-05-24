import styles from "@/app/Chat/ChatGraph/Flow/NodeTypes/NodeTypes.module.css"

import Node from "@/app/Chat/ChatGraph/Flow/NodeTypes/Node"

export default function FunctionNode ({ data }) {
    return (
        <Node color={[100, 100, 100]} inputExecution={true} outputExecution={true} className={styles.VerticalNode} data={data} />
    )
}