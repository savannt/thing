import authenticate from "@/services/authenticateRequest";

export default async function handler(req, res) {
    res.setHeader("Content-Type", "application/json");
    const didAuthenticate = await authenticate(req, res);
    if(!didAuthenticate) return res.status(401).json({ error: "Unauthorized" });
}