import stripe from "@/services/stripe";

import { clerkClient } from "@clerk/nextjs";


const defaultSeats = 1;

const defaultEnterpriseSettings = {
    groups: {
        onlyAllowGroups: false,
        defaultGroup: "None",
    },

    branding: {
        defaultTheme: "light",
        enableBranding: false,
    },

    loginProviders: {
        apple: false,
        discord: false,
        facebook: false,
        github: false,
        google: false,
        microsoft: false,
    },

    notifications: {
        allowSMS: false,
        allowEmail: false,
        allowDesktop: false,
    }
}

const defaultUserSettings = {
    language: "en",
    timezone: "auto",

    notifications: {
        allowSMS: false,
        smsList: [],
        allowEmail: false,
        emailList: [],
        allowDesktop: false,
    }
}


const defaultPublicUserMetadata = {
    seats: defaultSeats,
    subscribed_seats: defaultSeats,
    user_type: "preview"
}


const defaultUnsafeUserMetadata = {    
    theme: "light",

    settings: {
        ...defaultUserSettings,
    }
};

const defaultPublicEnterpriseMetadata = {
    settings: {
        ...defaultEnterpriseSettings,
    }
}

export default async function handler(req, res) {
    console.log("req.body", req.body);
    if(!req.body.type) console.error("No type provided!?");
    if(!req.body.data) console.error("No data provided!?");
    const type = req.body.type;
    const data = req.body.data;
    switch(type) {
        case "organization.created": {
            const createdByUserId = data.created_by;
            // get user metadata
            const user = await clerkClient.users.getUser(createdByUserId);
            let seats = user.publicMetadata?.seats || 0;

            await clerkClient.organizations.updateOrganization(data.id, {
                publicMetadata: defaultPublicEnterpriseMetadata,
                maxAllowedMemberships: seats,
            });
        }
        case "user.created": {

            const user = await clerkClient.users.getUser(data.id);
            if(!user) return res.status(404).json({ message: "User not found" });


            const stripeCustomer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: data.id }
            });
            

            const stripeCustomerId = stripeCustomer.id;
            if(!stripeCustomerId) return res.status(500).json({ message: "Failed to create Stripe Customer" });
            

            await clerkClient.users.updateUser(data.id, {
                unsafeMetadata: defaultUnsafeUserMetadata,
                publicMetadata: {
                    ...defaultPublicUserMetadata,
                    stripeCustomerId,
                    bills_on: "no subscription",
                    bills_for: 0,
                }
            });
        }
        case "user.updated": {
            const user = await clerkClient.users.getUser(data.id);
            if(!user) return res.status(404).json({ message: "User not found" });

            const publicMetadata = user.publicMetadata || {};
            const seats = publicMetadata.seats || 0;

            // get organizations that user is a member of
            
            const LIMIT = 10;
            let hasMore = true;
            let offset = 0;
            while(hasMore) {
                const organizations = await clerkClient.organizations.getOrganizationList({
                    limit: LIMIT,
                    offset,
                });
                if(!organizations) {
                    hasMore = false;
                    continue;
                }
                if(organizations.length >= LIMIT) hasMore = false;
                offset += LIMIT;
                for(let i = 0; i < organizations.length; i++) {
                    const organization = organizations[i];

                    // if owner is user, update maxAllowedMemberships
                    if(organization.createdBy === user.id) {
                        const maxAllowedMemberships = organization.maxAllowedMemberships || 0;
                        if(maxAllowedMemberships < seats) {
                            await clerkClient.organizations.updateOrganization(organization.id, {
                                maxAllowedMemberships: seats,
                            });
                        }
                    }
                }
            }
        } 
    }



    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
}