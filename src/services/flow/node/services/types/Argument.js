import Types from "@/services/flow/node/services/types/Types"

export default class Argument extends Types {

    constructor ({ name, type, required = false, description = "", value = null }) {
        super("argument");

        this.name = name;
        this.type = type;
        this.required = required;
        this.description = description;
        this.value = value;
    }

}