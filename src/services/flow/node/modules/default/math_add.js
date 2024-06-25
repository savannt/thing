export const metadata = {
    "description": "Adds two numbers",
    "in": {
        "a": {
            "type": "number",
            "description": "First number",
            "required": true
        },
        "b": {
            "type": "number",
            "description": "Second number",
            "required": true
        }
    },
    "out": {
        "type": "number",
        "description": "Sum of a and b"
    },
    "operation": true
}

export default function Add ({ a, b }) {
    return a + b;
}