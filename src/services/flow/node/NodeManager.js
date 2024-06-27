import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const NODES_PATH = path.join(__dirname, "./modules");
import Node from "@/services/flow/node/Node";

class NodeManager {


    constructor () {

    }

    async _compileNodes () {
        // get all files in NODES_PATH- if .js, import it, and get metadata
        
        let imports = [];
        // progressively import all files in NODES_PATH
        const importFile = async (dir) => {
            const files = await fs.promises.readdir(dir);
            for (let file of files) {
                const filePath = path.join(dir, file);
                const stat = await fs.promises.stat(filePath);
                if (stat.isDirectory()) {
                    await importFile(filePath);
                } else {
                    if (file.endsWith(".js")) {
                        try {
                            let localPath = filePath.split("/modules/")[1];
                            const module = await import("./modules/" + localPath);
                            imports.push({
                                path: localPath.replace(".js", ""),
                                module
                            });
                        } catch (err) {
                            // throw err;
                            console.log("Failed importing " + filePath);
                        }
                    }
                }
            }
        }
        await importFile(NODES_PATH);

        // for each import- get it's metadata export and it's default export- if default export not functino throw error- return Node.parse(fn, metadata);
        const nodes = imports.map(async (node) => {
            const { module, path } = node;

            const metadata = module.metadata;
            const fn = module.default;

            if (typeof fn !== "function") throw new Error("Default export must be a function, it currently is: " + typeof fn + "  , at " + path, fn);
            if (typeof metadata !== "object") throw new Error("Metadata must be an object");

            metadata.path = path;
            return Node.from(fn, metadata);
        });

        return await Promise.all(nodes);
    }

    async saveNodes () {
        const nodes = await this._compileNodes();
        // call asJSON on each nodes- map that to a JSON object where the key is it's name

        const nodesJSONArray = nodes.map(node => node.asJSON());
        const nodesJSON = {};
        nodesJSONArray.forEach(node => {
            nodesJSON[node.name] = node;
        });

        // write the object to file
        // await fs.promises.writeFile(path.join(__dirname, "_modules.json"), JSON.stringify(nodesJSON, null, 4));
        // write instead as a js file, and export default const

        await fs.promises.writeFile(path.join(__dirname, "_modules.js"), `export default ${JSON.stringify(nodesJSON, null, 4)}`);
    }

}
export default NodeManager;