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


    let type = data?.type;
    if(type.startsWith("execution-")) type = "execution";
    if(type.includes(":")) type = type.split(":")[0];
    
    const typeData = TYPES[type];
    let color = typeData?.color || [225, 225, 225];
    let alpha = typeData?.alpha || 0.7;


    const doAnimate = data?.animate || false;
    const doAnimateBackwards = data?.animateBackwards || false;

    let stroke = type === "execution" && doAnimate ? `var(--action-color)` : `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
    const strokeWidth = typeData?.stroke || 2;
    const opacity = doAnimate ? 0.8 : 1;

    if(doAnimateBackwards) {
        // make color construction orange
        // alpha = type.includes("execution") ? 0.8 : 0.25;
        stroke = `rgba(255, 165, 0, ${alpha})`;
    }

    // Determine the edge style based on data.type or data.color
    // const edgeStyle = data?.color ? { stroke: data.color, strokeWidth: 2 } : {};
    const edgeStyle = {
        stroke,
        strokeWidth,
        opacity,
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
            {
                doAnimate && !doAnimateBackwards && <path
                    style={{ ...style, ...edgeStyle }}
                    className="react-flow__edge-path-anim"
                    d={edgePath}
                    markerEnd={markerEnd}
                />
            }
            {
                doAnimateBackwards && <path
                    style={{ ...style, ...edgeStyle }}
                    className="react-flow__edge-path-anim-backwards"
                    d={edgePath}
                    markerEnd={markerEnd}
                />
            }
            <path
                style={{ stroke: "transparent", strokeWidth: 15, pointerEvents: "stroke" }}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
            />
        </>
    );
};
