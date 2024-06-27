import Types from "@/services/flow/node/services/types/Types"

export default class Argument extends Types {

    constructor (array, type = "number") {
        super("array", type);

        this.name = name;
        this.type = type;
        this.required = required;
        this.description = description;
        this.value = value;
    }

}