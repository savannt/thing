import styles from "@/app/Chat/ChatGraph/Flow/NodeTypes/NodeTypes.module.css"

import Node from "@/app/Chat/ChatGraph/Flow/NodeTypes/Node"

export default function EventNode ({ data }) {
    
    return (
        <Node color={[200, 200, 255]} left={true} inputExecution={false} className={styles.VerticalNode} data={data} />
    )
}