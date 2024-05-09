import Stripe from "stripe";
if(!process.env.STRIPE_PUBLIC_KEY) throw new Error("STRIPE_PUBLIC_KEY is not defined in .env.local");
if(!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not defined in .env.local");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export default stripe;