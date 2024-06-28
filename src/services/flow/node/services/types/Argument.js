import Type from "@/services/flow/node/services/Type"

export default class Argument extends Type {

    constructor ({ name, type, required = false, description = "", value = null }) {
        super("argument");

        this.setValue({
            name,
            type,
            required,
            description,
            value,
        })
    }

}