/**
 * Idempotently provision Stripe products, prices, and the AI generation
 * meter required for usage-based billing of Studio subscribers.
 *
 * Run with: pnpm tsx scripts/stripe-bootstrap.ts
 *
 * Output: prints env-style lines to paste into .env.local.
 */

import "dotenv/config";
import { stripe } from "../lib/stripe/client";

const METER_NAME = "ai_generation";

async function ensureMeter() {
  const meters = await stripe.billing.meters.list({ limit: 100 });
  const existing = meters.data.find((m) => m.event_name === METER_NAME);
  if (existing) return existing;

  return await stripe.billing.meters.create({
    display_name:        "AI generation",
    event_name:          METER_NAME,
    default_aggregation: { formula: "sum" },
    customer_mapping:    { type: "by_id", event_payload_key: "stripe_customer_id" },
    value_settings:      { event_payload_key: "value" },
  });
}

async function ensureProduct(name: string, metadata: Record<string, string> = {}) {
  const products = await stripe.products.list({ active: true, limit: 100 });
  const existing = products.data.find((p) => p.name === name);
  if (existing) return existing;
  return await stripe.products.create({ name, metadata });
}

async function ensurePrice(input: {
  product: string;
  amount: number;
  currency?: string;
  recurring?: { interval: "month" | "year" };
  meterId?: string;
}) {
  const prices = await stripe.prices.list({ product: input.product, active: true, limit: 100 });
  const existing = prices.data.find((p) =>
    p.unit_amount === input.amount &&
    Boolean(p.recurring) === Boolean(input.recurring) &&
    (input.recurring ? p.recurring?.interval === input.recurring.interval : true),
  );
  if (existing) return existing;

  return await stripe.prices.create({
    product:     input.product,
    unit_amount: input.amount,
    currency:    input.currency ?? "usd",
    recurring:   input.recurring,
  });
}

async function main() {
  console.log("→ ensuring meter…");
  const meter = await ensureMeter();

  console.log("→ ensuring products…");
  const indie    = await ensureProduct("Indie Pack");
  const pro      = await ensureProduct("Pro Pack");
  const studio   = await ensureProduct("Studio Subscription");
  const lifetime = await ensureProduct("Lifetime");

  console.log("→ ensuring prices…");
  const indiePrice    = await ensurePrice({ product: indie.id,    amount: 1900 });
  const proPrice      = await ensurePrice({ product: pro.id,      amount: 4900 });
  const studioMonthly = await ensurePrice({ product: studio.id,   amount: 2900, recurring: { interval: "month" } });
  const studioAnnual  = await ensurePrice({ product: studio.id,   amount: 22800, recurring: { interval: "year"  } });
  const lifetimePrice = await ensurePrice({ product: lifetime.id, amount: 14900 });

  console.log("\n# add the following to .env.local");
  console.log(`STRIPE_PRICE_INDIE_PACK=${indiePrice.id}`);
  console.log(`STRIPE_PRICE_PRO_PACK=${proPrice.id}`);
  console.log(`STRIPE_PRICE_STUDIO_MONTHLY=${studioMonthly.id}`);
  console.log(`STRIPE_PRICE_STUDIO_ANNUAL=${studioAnnual.id}`);
  console.log(`STRIPE_PRICE_LIFETIME=${lifetimePrice.id}`);
  console.log(`STRIPE_METER_AI_GENERATION=${meter.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
