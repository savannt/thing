export function stringify (nodeId) {
    // replace / with _
    return nodeId.replace(/\//g, "_");
}

export function parse (strNodeId) {
    // replace _ with /
    
    // split by _ then if not last section make first character capitalized- then join with /

    let splits = strNodeId.split("_");

    return splits.map((split, i) => {
        if(i === splits.length - 1) return split;
        return split.charAt(0).toUpperCase() + split.slice(1);
    }).join("/");
}