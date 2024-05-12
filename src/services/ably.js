import Ably from "ably";
if(!process.env.ABLY_API_KEY) throw new Error("ABLY_API_KEY is not defined in .env.local");
const ably = new Ably.Realtime.Promise(process.env.ABLY_API_KEY);

export default ably;