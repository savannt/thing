import Argument from "@/services/flow/node/services/types/Argument"
import Array from "@/services/flow/node/services/types/Array"
import TypeType from "@/services/flow/node/services/types/Type"

const Types = {
    "Argument": Argument,
    "Array": Array,
    "Type": TypeType,
}
export default Types;


export function parseName (name) {
    // return toLowerCase then make first letter uppercase
    return name.toLowerCase().charAt(0).toUpperCase() + name.slice(1);
}

export function isType (name) {
    name = parseName(name);
    return !!Types[name];
}

export function fromName (name) {
    name = parseName(name);
    if(!Types[name]) throw new Error(`Type ${name} does not exist`);
    return new Types[name]();
}

export function getValidValues (name) {
    const type = fromName(name);
    return type.getValidValues();
}