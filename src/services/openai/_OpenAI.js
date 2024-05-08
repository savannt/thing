import OpenAI from "openai";
import dotenv from "dotenv";
process.env = dotenv.config({ path: ".env.local" }).parsed;

export const OPENAI_MODEL = "gpt-4-0125-preview";

if(!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not defined in .env.local");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export default openai;