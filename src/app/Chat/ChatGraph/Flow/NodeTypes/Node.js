import styles from "@/app/Chat/ChatGraph/Flow/NodeTypes/NodeTypes.module.css"

import { Handle } from "reactflow"

import FieldValue from "@/app/Chat/ChatGraph/Flow/ValueTypes/FieldValue";
import InputValue from "@/app/Chat/ChatGraph/Flow/ValueTypes/InputValue";

export default function Node ({ color=[200, 200, 200], left = false, right = false, inputExecution = true, outputExecution = true, className, data, children }) {    
    const semiTransparentColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.2)`


    // convert both data.in and data.out to array of objects where key is a name property
    const inValues = data.in ? Object.entries(data.in).map(([name, data]) => ({ name, ...data, input: true, output: false })) : [];
    const outValues = data.out ? Object.entries(data.out).map(([name, data]) => ({ name, ...data, input: false, output: true })) : [];
    
    // combine the two arrays by starting with the first in, then the first out, then the second in, etc
    let values = [];
    for (let i = 0; i < Math.max(inValues.length, outValues.length); i++) {
        if (inValues[i]) values.push(inValues[i]);
        if (outValues[i]) values.push(outValues[i]);
    }
    const hasValues = values.length > 0;
    
    
    
    return (
        <div className={`${styles.Node} ${className} ${data.deleting ? "deleting" : ""} ${data.copying ? "copying" : ""}`} style={{
            border: `2px solid ${semiTransparentColor}`
        }}>
            <div className={`${styles.Node__Header} ${!left ? "" : styles.Node__Header__NoLeft}`} style={{
                background: semiTransparentColor
            }}>
                { inputExecution && <Handle type="target" position="left" id="execution" />}
                <h1>{data.label}</h1>
                <h2>{data.details}</h2>
                { outputExecution && <Handle type="source" position="right" id="execution" />}
            </div>

            <div className={`${styles.Node__Outputs} ${left ? styles.Node__Outputs__Left : ""} ${right ? styles.Node__Outputs__Right : ""}`}>
                {
                    hasValues && values.map((data, i) => {
                        const {
                            name,
                            type,
                            description,
                            input = false,
                            output = false,
                            constant = false
                        } = data;

                        const style = {
                            float: "unset",
                        };

                        // if input, and next value is output, float left
                        if(input && values[i + 1] && values[i + 1].output) {
                            style.float = "left";
                            style.maxWidth = "fit-content";
                        }

                        // if output and next value is input, float right
                        if(output && values[i + 1] && values[i + 1].input) {
                            style.float = "right";
                            style.maxWidth = "fit-content";
                        }

                        console.log("value", data);

                        if(constant) {
                            if(type === "string") {
                                return <InputValue data={data} style={style} value="Default constant value" />
                            } else {
                                return <FieldValue data={data} style={style} />
                            }
                        } else {
                            return <FieldValue data={data} style={style} />
                        }
                    })
                }
                
                { children }
            </div>
       </div>
    )
}