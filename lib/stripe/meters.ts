import { stripe } from "@/lib/stripe/client";

/**
 * Fire a Stripe billing meter event. The same idempotencyKey used in the
 * credit ledger is reused as the meter event identifier so retries are
 * safe end-to-end.
 *
 * Note: never use the deprecated stripe.billing.usageRecords API. It was
 * removed in API version 2025-03-31.basil. Use meterEvents instead.
 */
export async function fireMeterEvent(
  eventName: "ai_generation" | "screenshot_generated",
  customerId: string,
  idempotencyKey: string,
  value = 1,
): Promise<void> {
  await stripe.billing.meterEvents.create({
    event_name: eventName,
    payload: {
      value: String(value),
      stripe_customer_id: customerId,
    },
    identifier: idempotencyKey,
  });
}
