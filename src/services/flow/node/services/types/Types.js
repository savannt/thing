// we need to make a "parent" class that all types inherit from

class Type {
    constructor (name, secondaryType) {
        this.name = name;
        this.secondaryType = secondaryType;
    }

    getFormattedName () {
        return this.secondaryType ? `${this.name}<${this.secondaryType}>` : this.name;
    }
}
export default Type;