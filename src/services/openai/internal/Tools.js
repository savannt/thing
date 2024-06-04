import Tool from "./Tool.js";

export default class Tools {
    constructor (tools = []) {
        this.tools = tools;
    }

    async handleExecution (name, args) {
        // TODO: tool.function is exclusive here
        
        const tool = this.tools.find(tool => {
            // tool.function.name === name
            let toolObj = tool.asJSON();
            return toolObj.function.name === name;
        });
        if(!tool) throw new Error(`Tool with name ${name} not found`);

        return await tool.data.jsFunction(args);
    }

    asArray () {
        return this.tools.map(tool => tool.asJSON());
    }

    validate () {
        // run validate on each tools
        for(let i = 0; i < this.tools.length; i++) {
            const tool = this.tools[i];
            const { valid, reason } = tool.validate();
            if(!valid) return { valid, reason: `Tool at index ${i} is invalid: ${reason}` };
        }
        return { valid: true, reason: null };
    }

    async add (tool) {
        if(!tool) throw new Error("Tool is not defined");
        if(!(tool instanceof Tool)) throw new Error("Tool must be an instance of Tool");

        const { valid, reason } = tool.validate();
        if(!valid) throw new Error(`Tool is not valid: ${reason}`);

        this.tools.push(tool);
    }

    static empty () {
        return new Tools();
    }
}