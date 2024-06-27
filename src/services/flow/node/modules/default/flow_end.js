export const metadata = {
    "description": "Ends a flow",
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
    "out": {},
    "icon": "end"
}

export default function Flow_end ({ }) {
    return {};
}