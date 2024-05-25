import Edge from "@/app/Chat/ChatGraph/Flow/EdgeTypes/Edge"

export default function DataEdge ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data }) {
    return (
        <Edge id={id} sourceX={sourceX} sourceY={sourceY} targetX={targetX} targetY={targetY} sourcePosition={sourcePosition} targetPosition={targetPosition} style={style} markerEnd={markerEnd} data={data} />
    )
};
