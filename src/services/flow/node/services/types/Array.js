import Type from "@/services/flow/node/services/Type"

export default class Argument extends Type {

    constructor (array, type = "number") {
        super("array", type);

        this.setValue({ array });
    }

}