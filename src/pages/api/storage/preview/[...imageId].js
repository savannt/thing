// imports GridFsStorage engine instance
import crypto from "crypto";
import multer from "multer";
import mongo, { gfs as _gfs } from "@/services/mongodb";
import { GridFsStorage } from "multer-gridfs-storage";
import fs from "fs";

import authenticate from "@/services/authenticateRequest";
import user from "@/client/user";


const unknownFileType = fs.readFileSync("public/images/unknown_file_type.png");

const storage = new GridFsStorage({
    url: `mongodb+srv://nobusiness:Nobusiness909@cluster0.p7aocaq.mongodb.net/nobusiness`,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            authenticate(req).then(({ userId }) => {
                if(!userId) return reject(new Error("Unauthorized")); 
                // generatet random file id
                const fileId = Math.floor(Math.random() * 100000000000000000).toString(16);

                crypto.randomBytes(16, (err, buf) => {
                    if(err) return reject(err);

                    const filename = `${buf.toString("hex")}_${file.originalname}`;
                    const fileInfo = {
                        filename,
                        bucketName: "uploads",
                        metadata: {
                            userId,
                            fileId,
                        }
                    };
                    resolve(fileInfo);
                });
            });
        });
    }
})

const upload = multer({ storage });

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    const { userId } = await authenticate(req, res);
    if(!userId) return res.status(401).json({ message: "Unauthorized" });

    const { db } = await mongo();

    const imageId = req.query.imageId && req.query.imageId[0] || false;
    if(!imageId) return res.status(400).json({ message: "No imageId provided" });

    console.log("preview_imageId", imageId);


    const gfs = await _gfs();
    // find metadata.fileId = imageId

    
    const file = await db.collection("uploads.files").find({ "metadata.fileId": imageId }).toArray();
    if(!file.length) return res.status(404).json({ message: "File not found" });

    const contentType = file[0].metadata.contentType;
    const filename    = file[0].metadata.filename;


    // if not type of image, download instead of render
    if(contentType && !contentType.includes("image")) {
        // send public/images/unknown_file_type.png instead
        res.setHeader("Content-Type", "image/png");
        // set custom header, "isDefaultImage"
        res.setHeader("X-Is-Default-Image", "true");
        return res.send(unknownFileType);
    }
    res.setHeader("X-Is-Default-Image", "false");
    res.setHeader("Content-Type", contentType);

    const readStream = gfs.openDownloadStreamByName(filename);
    readStream.pipe(res);
}
