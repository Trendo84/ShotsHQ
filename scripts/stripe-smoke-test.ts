/**
 * Stripe checkout smoke test — pre-launch readiness verification.
 *
 * Runs locally against the configured Stripe environment (test or live)
 * without touching the database, ledger, or webhook handler. Confirms:
 *
 *   1. STRIPE_SECRET_KEY is set and authenticates against the Stripe API.
 *   2. Each plan has a configured STRIPE_PRICE_* env var.
 *   3. Each price ID resolves to a live, active Stripe price.
 *   4. createCheckoutSession() (the same helper the route uses) actually
 *      mints a session URL for each plan.
 *   5. The webhook signing secret is set, and the meter named
 *      "ai_generation" exists and is wired to the right event.
 *
 * What it does NOT do:
 *   - Create real charges. Sessions are minted but not paid.
 *   - Hit /api/stripe/checkout. The route is a thin wrapper around the
 *     helper this script tests directly — testing the helper is enough,
 *     and avoids needing a running dev server.
 *
 * Run with: pnpm tsx scripts/stripe-smoke-test.ts
 *
 * Exit code 0 = ready to ship; non-zero = blockers documented inline.
 *
 * Design note: never logs secret keys, only redacted prefixes (sk_live…
 * / sk_test…). Safe to capture into CI logs.
 */

import "dotenv/config";
import { stripe } from "../lib/stripe/client";
import { createCheckoutSession, type CheckoutPlan } from "../lib/stripe/checkout";

type Check =
  | { kind: "pass"; label: string; detail?: string }
  | { kind: "fail"; label: string; detail: string }
  | { kind: "warn"; label: string; detail: string };

const PLANS: { plan: CheckoutPlan; envVar: string; expectedRecurring: boolean }[] = [
  { plan: "indie",          envVar: "STRIPE_PRICE_INDIE_PACK",     expectedRecurring: false },
  { plan: "pro",            envVar: "STRIPE_PRICE_PRO_PACK",       expectedRecurring: false },
  { plan: "studio_monthly", envVar: "STRIPE_PRICE_STUDIO_MONTHLY", expectedRecurring: true  },
  { plan: "studio_annual",  envVar: "STRIPE_PRICE_STUDIO_ANNUAL",  expectedRecurring: true  },
  { plan: "lifetime",       envVar: "STRIPE_PRICE_LIFETIME",       expectedRecurring: false },
];

const checks: Check[] = [];

function pass(label: string, detail?: string) { checks.push({ kind: "pass", label, detail }); }
function fail(label: string, detail: string)  { checks.push({ kind: "fail", label, detail }); }
function warn(label: string, detail: string)  { checks.push({ kind: "warn", label, detail }); }

function redactKey(key: string | undefined): string {
  if (!key) return "(unset)";
  if (key.length < 12) return "(too short)";
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

async function checkApiAuth() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    fail("STRIPE_SECRET_KEY", "Not set. Add to .env.local or Vercel.");
    return false;
  }
  try {
    const acct = await stripe.accounts.retrieve();
    pass(
      "Stripe API auth",
      `${redactKey(key)} → account ${acct.id} (${acct.business_profile?.name ?? "no business profile"})`,
    );
    if (key.startsWith("sk_live_")) {
      warn(
        "LIVE-KEY MODE",
        "You're testing against the LIVE Stripe environment. Sessions minted here are real-mode and customers could pay against them. Use test keys for routine smoke checks.",
      );
    }
    return true;
  } catch (err) {
    fail("Stripe API auth", `Authentication failed: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function checkPlanPrice(plan: typeof PLANS[number]) {
  const priceId = process.env[plan.envVar];
  if (!priceId) {
    fail(`${plan.envVar}`, "Not set. Run pnpm tsx scripts/stripe-bootstrap.ts and paste the printed value.");
    return null;
  }
  try {
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active) {
      fail(`${plan.envVar}`, `Price ${priceId} exists but is not active in Stripe.`);
      return null;
    }
    if (Boolean(price.recurring) !== plan.expectedRecurring) {
      fail(
        `${plan.envVar}`,
        `Plan "${plan.plan}" expects ${plan.expectedRecurring ? "recurring" : "one-time"} pricing, ` +
          `but ${priceId} is ${price.recurring ? "recurring" : "one-time"}.`,
      );
      return null;
    }
    const amount = price.unit_amount != null ? `$${(price.unit_amount / 100).toFixed(2)}` : "metered";
    const cadence = price.recurring ? `/ ${price.recurring.interval}` : "(one-time)";
    pass(`${plan.envVar}`, `${priceId} · ${amount} ${cadence}`);
    return price;
  } catch (err) {
    fail(`${plan.envVar}`, `Stripe says no: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

async function checkSessionMint(plan: typeof PLANS[number]) {
  try {
    const session = await createCheckoutSession({
      plan:        plan.plan,
      // Synthetic IDs — sessions are valid for 24h and never charged here.
      userId:      `smoke_test_${Date.now()}`,
      customerId:  null,
      email:       "smoke-test+stripe@shotshq.com",
    });
    if (!session.url) {
      fail(`createCheckoutSession(${plan.plan})`, "Session created but URL is null.");
      return;
    }
    pass(`createCheckoutSession(${plan.plan})`, `→ ${session.url.slice(0, 80)}…`);
  } catch (err) {
    fail(
      `createCheckoutSession(${plan.plan})`,
      err instanceof Error ? err.message : String(err),
    );
  }
}

async function checkWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    warn(
      "STRIPE_WEBHOOK_SECRET",
      "Not set. Webhooks won't validate — checkout success won't grant credits. Set after running `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.",
    );
    return;
  }
  if (!secret.startsWith("whsec_")) {
    fail("STRIPE_WEBHOOK_SECRET", `Should start with "whsec_". Got: ${redactKey(secret)}`);
    return;
  }
  pass("STRIPE_WEBHOOK_SECRET", redactKey(secret));
}

async function checkMeter() {
  try {
    const meters = await stripe.billing.meters.list({ limit: 100 });
    const ai = meters.data.find((m) => m.event_name === "ai_generation");
    if (!ai) {
      fail(
        "Stripe meter `ai_generation`",
        "Not provisioned. Run `pnpm tsx scripts/stripe-bootstrap.ts` to create it.",
      );
      return;
    }
    if (ai.status !== "active") {
      fail("Stripe meter `ai_generation`", `Meter exists but status=${ai.status}.`);
      return;
    }
    pass(
      "Stripe meter `ai_generation`",
      `${ai.id} · event=${ai.event_name} · aggregation=${ai.default_aggregation.formula}`,
    );
  } catch (err) {
    fail("Stripe meter `ai_generation`", err instanceof Error ? err.message : String(err));
  }
}

async function main() {
  console.log("\n┌─ Stripe checkout smoke test ─────────────────────────────────────");
  console.log("│  Mode:", process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "LIVE" : "TEST");
  console.log("│  Time:", new Date().toISOString());
  console.log("└──────────────────────────────────────────────────────────────────\n");

  const authed = await checkApiAuth();
  if (!authed) {
    printSummary();
    process.exit(1);
  }

  await checkWebhookSecret();
  await checkMeter();

  for (const plan of PLANS) {
    const price = await checkPlanPrice(plan);
    if (price) await checkSessionMint(plan);
  }

  printSummary();

  const blockers = checks.filter((c) => c.kind === "fail").length;
  process.exit(blockers === 0 ? 0 : 1);
}

function printSummary() {
  console.log("\n┌─ Results ────────────────────────────────────────────────────────");
  for (const c of checks) {
    const glyph = c.kind === "pass" ? "✓" : c.kind === "warn" ? "!" : "✕";
    const color = c.kind === "pass" ? "\x1b[32m" : c.kind === "warn" ? "\x1b[33m" : "\x1b[31m";
    const reset = "\x1b[0m";
    console.log(`│ ${color}${glyph}${reset} ${c.label}${c.detail ? `\n│     ${c.detail}` : ""}`);
  }
  const fails = checks.filter((c) => c.kind === "fail").length;
  const warns = checks.filter((c) => c.kind === "warn").length;
  const passes = checks.filter((c) => c.kind === "pass").length;
  console.log("├──────────────────────────────────────────────────────────────────");
  console.log(`│ ${passes} pass · ${warns} warn · ${fails} fail`);
  console.log("└──────────────────────────────────────────────────────────────────\n");

  if (fails === 0) {
    console.log("Ready to take traffic. Webhook handler is the next thing to test —");
    console.log("`stripe trigger checkout.session.completed --override-checkout-session=…`\n");
  } else {
    console.log("Fix the items marked ✕ above before lifting the WIP banner.\n");
  }
}

main().catch((err) => {
  console.error("[smoke] unexpected failure", err);
  process.exit(1);
});
