import { stripe } from "@/lib/stripe/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type CheckoutPlan = "indie" | "pro" | "studio_monthly" | "studio_annual" | "lifetime";

const PRICE_BY_PLAN: Record<CheckoutPlan, string | undefined> = {
  indie:           process.env.STRIPE_PRICE_INDIE_PACK,
  pro:             process.env.STRIPE_PRICE_PRO_PACK,
  studio_monthly:  process.env.STRIPE_PRICE_STUDIO_MONTHLY,
  studio_annual:   process.env.STRIPE_PRICE_STUDIO_ANNUAL,
  lifetime:        process.env.STRIPE_PRICE_LIFETIME,
};

const RECURRING: Record<CheckoutPlan, boolean> = {
  indie:           false,
  pro:             false,
  studio_monthly:  true,
  studio_annual:   true,
  lifetime:        false,
};

export async function createCheckoutSession(input: {
  plan: CheckoutPlan;
  userId: string;
  customerId?: string | null;
  email: string;
}) {
  const price = PRICE_BY_PLAN[input.plan];
  if (!price) throw new Error(`Stripe price for plan "${input.plan}" not configured`);

  return await stripe.checkout.sessions.create({
    mode: RECURRING[input.plan] ? "subscription" : "payment",
    line_items: [{ price, quantity: 1 }],
    customer:       input.customerId ?? undefined,
    customer_email: input.customerId ? undefined : input.email,
    client_reference_id: input.userId,
    metadata: { plan: input.plan, userId: input.userId },
    success_url: `${APP_URL}/billing/success?cs={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${APP_URL}/pricing`,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  });
}

export async function createPortalSession(customerId: string) {
  return await stripe.billingPortal.sessions.create({
    customer:    customerId,
    return_url:  `${APP_URL}/billing`,
  });
}
