// we need to make a "parent" class that all types inherit from

// import Types from "@/services/flow/node/services/Types";

export default class Type {
    constructor (name, secondaryType) {
        this.name = name;
        this.secondaryType = secondaryType;

        this.validValues = false;
    }

    getFormattedName () {
        return this.secondaryType ? `${this.name}<${this.secondaryType}>` : this.name;
    }


    setValue (value) {
        this.value = value;
    }

    getValue () {
        return this.value;
    }


    setValidValues (validValues) {
        this.validValues = validValues;
    }

    getValidValues () {
        return this.validValues;
    }
}
