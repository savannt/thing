import { getBezierPath, getMarkerEnd } from 'reactflow';

import TYPES from "@/app/Chat/ChatGraph/Flow/Types"

export default function Edge ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data }) {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    });


    const type = data?.type;
    const typeData = TYPES[type];
    const color = typeData?.color || [225, 225, 225];
    const alpha = typeData?.alpha || 0.5;


    const stroke = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
    const strokeWidth = typeData?.stroke || 2;


    // Determine the edge style based on data.type or data.color
    // const edgeStyle = data?.color ? { stroke: data.color, strokeWidth: 2 } : {};
    const edgeStyle = {
        stroke,
        strokeWidth,
    }

    return (
        <>
            <path
                id={id}
                style={{ ...style, ...edgeStyle }}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
            />
            { /* create an invisible duplicate of the above for a wider pointer-event region*/ }
            <path
                style={{ stroke: "transparent", strokeWidth: 15, pointerEvents: "stroke" }}
                className="react-flow__edge-path"
                d={edgePath}
            />
        </>
    );
};
