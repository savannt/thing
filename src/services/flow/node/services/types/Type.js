import Type from "@/services/flow/node/services/Type"

export default class TypeType extends Type {

    constructor (type) {
        super("type");

        this.setValue({ type });
        this.setValidValues([
            "string",
            "number",
            "boolean",
            "array",
        ]);
    }
}