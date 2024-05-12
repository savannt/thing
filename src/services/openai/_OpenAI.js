import OpenAI from "openai";

export const OPENAI_MODEL = "gpt-4-0125-preview";

if(!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not defined in .env.local");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export default openai;