import mongo  from "@/services/mongodb";
import { generateGroupId } from "@/services/generator";

import { clerkClient } from "@clerk/nextjs";

import authenticate from "@/services/authenticateRequest";

export default async function handler(req, res) {
    // get enterpriseId from URL [...enterpriseSlug].js
    const enterpriseSlug = req.query.slug || false;
    // console.log("enterpriseSlug", enterpriseSlug)
    if(!enterpriseSlug) return res.status(200).json({ message: "Invalid enterpriseId" });


    try {
        const organization = await clerkClient.organizations.getOrganization({ slug: enterpriseSlug });
        if(!organization) return res.status(200).json({ message: "Organization not found" });
        return res.status(200).json({
            image: organization.hasImage ? organization.imageUrl : false,
            loginProviders: organization?.publicMetadata?.settings?.loginProviders || [],
        });
    } catch (err) {
        res.status(200).json({ });
    }
}