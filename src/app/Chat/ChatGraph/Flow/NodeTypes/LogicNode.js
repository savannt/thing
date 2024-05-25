import styles from "@/app/Chat/ChatGraph/Flow/NodeTypes/NodeTypes.module.css"

import Node from "@/app/Chat/ChatGraph/Flow/NodeTypes/Node"


export default function LogicNode ({ data }) {
    return (
        <Node color={[0, 0, 0]} left={true} inputExecution={false} outputExecution={false} className={styles.VerticalNode} data={data} />
    )
}