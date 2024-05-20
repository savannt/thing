import OpenAI from "openai";
import dotenv from "dotenv";

export const OPENAI_MODEL = "gpt-4-0125-preview";

if(!process.env.OPENAI_API_KEY) {
    // try and use dotenv to load .env.local at root of project
    process.env = dotenv.config({ path: process.cwd() + "/.env.local" }).parsed;
    if(!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not defined in .env.local");
}
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export default openai;