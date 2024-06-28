export const values = ["string", "number", "boolean", "array"];

export const metadata = {
    "description": "A type constant",
    "out": {
        "type": "type",
        "description": "The constant type value",
        "constant": true,
        "values": values
    },
    "operation": true
}

export default function Constant_type ({ value }) {
    if(!values.includes(value)) throw new Error(`Invalid type value: ${value}`);
    return value;
}