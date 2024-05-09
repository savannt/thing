import mongo from "@/services/mongodb";

import { getAuth } from "@clerk/nextjs/server"

export default async function authenticate (req, res) {
   return getAuth(req);
}