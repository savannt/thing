import { MongoClient } from "mongodb";
import { GridFSBucket } from "mongodb";

let client, db, gfsClient;
let clientPromise;

if(!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not defined in .env.local");
if(!process.env.MONGODB_DB) throw new Error("MONGODB_DB is not defined in .env.local");

clientPromise = MongoClient.connect(process.env.MONGODB_URI, {});

export default async function mongo() {
    if(client) {
        // ensure we are still connected
        try {
            await client.db("admin").command({ ping: 1 });
            return { client, db };
        } catch (e) {
            client = null;
        }
    }

    client = await clientPromise;
    db = client.db(process.env.MONGODB_DB);

    return { client, db };
}

export async function gfs () {
    if(gfsClient) return gfsClient;
    const { client } = await mongo();
    // create bucket
    gfsClient = new GridFSBucket(client.db(process.env.MONGODB_DB), {
        bucketName: "uploads",
    });
    return gfsClient;
}

export { clientPromise };