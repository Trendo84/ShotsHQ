import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key && process.env.NODE_ENV === "production") {
  throw new Error("STRIPE_SECRET_KEY is required in production");
}

export const stripe = new Stripe(key ?? "sk_test_placeholder", {
  apiVersion: "2025-08-27.basil",
  typescript: true,
});
