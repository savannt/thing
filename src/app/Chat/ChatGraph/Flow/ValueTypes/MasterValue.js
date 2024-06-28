import styles from "@/app/Chat/ChatGraph/Flow/ValueTypes/ValueTypes.module.css"

import { NodeGroup } from "@/app/Chat/ChatGraph/Flow/NodeTypes/Node"

import InputValue from "@/app/Chat/ChatGraph/Flow/ValueTypes/InputValue";
import DropdownValue from "@/app/Chat/ChatGraph/Flow/ValueTypes/DropdownValue";
import FieldValue from "@/app/Chat/ChatGraph/Flow/ValueTypes/FieldValue";

export const INPUT_TYPES = [
    "string",
]

export default function MasterValue ({ onChange, data, style }) {
    const {
        type,
        constant,
        values = false
    } = data;
    
    const {
        dataType,
        input  = false,
        output = false,
    } = data;

    const isConnected = data._connected || false;


    if(!isConnected) {
        if(input) {
            if(type && INPUT_TYPES.includes(type)) return <InputValue onChange={onChange} data={data} style={style} />
            if(type === "type") return <DropdownValue onChange={onChange} data={data} style={style} />
        }
    }

    if(values) {
        // this is a dropdown
        return <DropdownValue onChange={onChange} data={data} style={style} />
    }

    if(type === "group") return <NodeGroup onChange={onChange} data={data} style={style} />
    if(type === "string" && constant) return <InputValue onChange={onChange} data={data} style={style} />

    return <FieldValue onChange={onChange} data={data} style={style} />
}