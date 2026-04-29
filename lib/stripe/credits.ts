import { stripe } from "@/lib/stripe/client";

/**
 * Create a Stripe Billing Credit Grant for a one-off pack purchase.
 * Required for usage-based reporting against metered subscriptions; the
 * actual user-facing credit balance is tracked in our own credit_ledger.
 */
export async function createCreditGrant(input: {
  customerId: string;
  amountCents: number;
}) {
  return await stripe.billing.creditGrants.create({
    customer: input.customerId,
    amount: { type: "monetary", monetary: { value: input.amountCents, currency: "usd" } },
    applicability_config: { scope: { price_type: "metered" } },
    category: "paid",
  });
}

export async function listCreditGrants(customerId: string) {
  return await stripe.billing.creditGrants.list({ customer: customerId, limit: 100 });
}
