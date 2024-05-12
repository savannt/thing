import axios from "axios";
import FormData from "form-data";
import { MongoClient } from "mongodb";
import multer from "multer";
import { GridFSBucket } from "mongodb";
import authenticate from "@/services/authenticateRequest";
// import openai from "@/services/openai";
// import { createReadStream } from "fs";
// import { promisify } from "util";

// Database connection
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB);
const bucket = new GridFSBucket(db, {
    bucketName: "uploads"
});

// Multer storage using memory storage to temporarily hold the file
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const config = {
    api: {
        bodyParser: false // We need to disable the default bodyParser to use multer
    }
}

async function uploadToOpenAI(fileBuffer, filename, contentType) {
    const form = new FormData();
    form.append("file", fileBuffer, { filename: filename, contentType: contentType });
    form.append("purpose", "assistants");

    try {
        const response = await axios.post('https://api.openai.com/v1/files', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error("OpenAI API Error: ", error.response.data);
            throw new Error(`OpenAI Upload Failed: ${error.response.data.error.message}`);
        } else {
            console.error("Error sending request to OpenAI: ", error.message);
            throw new Error("Error sending request to OpenAI");
        }
    }
}

export default async function handler(req, res) {
    const imageId = req.query.imageId && req.query.imageId[0] || false;

    if(imageId === "upload") {
        try {
            const { userId } = await authenticate(req);
            if (!userId) {
                throw new Error("Unauthorized");
            }
    
            await new Promise((resolve, reject) => {
                upload.single('file')(req, res, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
    
            if (!req.file) {
                throw new Error("File upload failed");
            }
    
            const file = req.file;
            
            console.log("file", file);
    
            const { buffer, originalname, mimetype } = file;
            const openaiResponse = await uploadToOpenAI(buffer, originalname, mimetype);
            console.log("Uploaded to OpenAI");
    
            // OpenAI File ID as MongoDB ID
            const fileId = openaiResponse.id;
    
            // Writing buffer directly to GridFS
            const uploadStream = bucket.openUploadStream(originalname, {
                metadata: {
                    userId,
                    fileId,
                    contentType: mimetype,
                    filename: originalname,
                }
            });
    
            uploadStream.end(buffer); // Directly write buffer to GridFS
    
            await new Promise((resolve) => {
                uploadStream.on('finish', () => {
                    resolve();
                });
            });
            res.status(200).json({
                success: true,
                fileId,
                filename: originalname,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    } else {
        try {
            const { userId } = await authenticate(req);
            if (!userId) {
                throw new Error("Unauthorized");
            }
    
            const file = await db.collection("uploads.files").find({ "metadata.fileId": imageId }).toArray();
            if(!file.length) return res.status(404).json({ message: "File not found" });

            console.log("file", file[0]);

            const contentType = file[0].metadata.contentType;
            const filename    = file[0].metadata.filename;
            
            const downloadStream = bucket.openDownloadStreamByName(filename);
            res.setHeader("Content-Type", contentType);
            downloadStream.pipe(res);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }
}
