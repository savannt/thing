export const TOOL_TYPES = [
    "function"
]

export default class Tool {
    constructor (toolData, data) {
        this.toolData = toolData;
        this.data = data;
    }

    validate () {
        return Tool.validate(this.toolData);
    }

    asJSON () {
        const { valid, reason } = this.validate();
        if(!valid) throw new Error(`Tool is not valid: ${reason}`);

        return this.toolData;
    }

    static createFromJsFn (jsFunction, properties, required) {
        return Tool.createFromJsFunction(jsFunction.name, jsFunction.description || "", jsFunction, properties, required);
    }

    static createFromJsFunction (name, description, jsFunction, properties = {}, required = []) {
        if(!name) throw new Error("Name is required");
        if(description && typeof description !== "string") throw new Error("Description must be a string");
        if(!jsFunction) throw new Error("Function is required");
        if(typeof jsFunction !== "function") throw new Error("Function must be a function");
        if(properties && typeof properties !== "object") throw new Error("Properties must be an object");
        if(required && !Array.isArray(required)) throw new Error("Required must be an array");

        return new Tool({
            "type": "function",
            "function": {
                name,
                description,
                parameters: {
                    type: "object",
                    properties,
                    required
                },
            }
        }, {
            jsFunction
        });
    }

    static validate (toolObject) {
        let valid = false;
        let reason = null;
        
        const { type } = toolObject;

        if(!type) return { valid: false, reason: "Type is required" };
        if(TOOL_TYPES.indexOf(type) === -1) return { valid: false, reason: "Type is invalid" };

        if(type === "function") {
            const { name, description, parameters } = toolObject["function"];
            if(!name) return { valid: false, reason: "Function name is required" };
            // if(!description) return { valid: false, reason: "Function description is required" };

            if(parameters) {
                const { type: parametersType, properties: parameterProperties, required: parameterRequired } = parameters;

                if(!parametersType) return { valid: false, reason: "Parameters type is required" };
                if(parametersType !== "object") return { valid: false, reason: "Parameters type must be an object" };

                if(parameterProperties) {
                    if(typeof parameterProperties !== "object") return { valid: false, reason: "Parameter properties must be an object" };
                }

                if(parameterRequired) {
                    if(!Array.isArray(parameterRequired)) return { valid: false, reason: "Parameter required must be an array" };
                }
            }

            valid = true;
        }

        if(!valid && !reason) reason = "Unsupported tool type";
        return { valid, reason }
    }
}