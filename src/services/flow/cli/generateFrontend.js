// This script when ran will generate a JSON file which is a map of our nodes-- safe for frontend use (removed imports - only meteadata is included)

// import "../../../../load-tsconfig-paths.js"
const Flow = await import("@/services/flow/Flow");
console.log("Flow", Flow);

// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import moduleAlias from "module-alias";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const srcPath = path.join(__dirname, "../../../");


// moduleAlias.addAliases({
//     "@": srcPath
// });

// // Paths are relative to this file
// const FILE_PATH = "./frontendNodeDictionary.json";
// const NODES_PATH = "../nodes";



// (async () => {
    
//     // for each js file inside of the nodes directory-- get it's exported metadata const
//     // we are using imports not require




//     // make paths relative to this file's location- not run location
//     const nodesPath = path.join(__dirname, NODES_PATH);
//     const filePath = path.join(__dirname, FILE_PATH);


//     const nodes = fs.readdirSync(nodesPath);
//     const nodeMetadatas = nodes.map(async node => {
//         if(!node.includes(".js")) return;
//         const nodePath = path.join(nodesPath, node);
//         const nodeFile = await import(nodePath);
//         return nodeFile.metadata;
//     });

    

// })();