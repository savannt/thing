import styles from "@/app/Chat/ChatGraph/Flow/ValueTypes/ValueTypes.module.css"

import { NodeGroup } from "@/app/Chat/ChatGraph/Flow/NodeTypes/Node"

import InputValue from "@/app/Chat/ChatGraph/Flow/ValueTypes/InputValue";
import FieldValue from "@/app/Chat/ChatGraph/Flow/ValueTypes/FieldValue";

export const INPUT_TYPES = [
    "string",
]

export default function MasterValue ({ onChange, data, style }) {
    const {
        type,
        constant
    } = data;
    
    const {
        dataType,
        input  = false,
        output = false,
    } = data;

    const isConnected = data._connected || false;


    // console.log(type, data);
    if(input && type && INPUT_TYPES.includes(type)) {
        
        if(!isConnected) return <InputValue onChange={onChange} data={data} style={style} />
    }

    if(type === "group") return <NodeGroup onChange={onChange} data={data} style={style} />
    if(type === "string" && constant) return <InputValue onChange={onChange} data={data} style={style} />

    return <FieldValue onChange={onChange} data={data} style={style} />
}