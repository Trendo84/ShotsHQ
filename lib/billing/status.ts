/**
 * Shared billing-status helpers.
 *
 * Browser audit cycle #9 (2026-05-23) found `/billing` honest about
 * the basics (`user.plan`, `getBalance()`, `getLedgerHistory()` are
 * all read for real) but rendering the pack list identically for
 * every user. Free users got the same `STUDIO ANNUAL` purchase
 * button as Studio subscribers; Studio/Lifetime users saw
 * `INDIE PACK $19` + `PRO PACK $49` purchase CTAs that don't make
 * sense for unmetered plans. No data attributes for testability,
 * no `Manage subscription` affordance for paid users even though
 * `/api/stripe/portal` already exists.
 *
 * This module is the cycle-#5-pattern fix: derive everything from
 * real state, expose canonical enums + per-pack relevance for both
 * the UI to render against AND the e2e to assert against. Pure
 * functions — no React, no DOM, no DB.
 */

import type { User } from "@/lib/db/schema";

/** Canonical plan enum — mirrors `planEnum` in lib/db/schema.ts. */
export type BillingPlan = "free" | "studio_monthly" | "studio_annual" | "lifetime";

/**
 * Per-pack relevance to the current user's plan.
 *
 *   current   — user is already on this exact subscription cadence;
 *               purchasing again is a no-op the UI shouldn't offer.
 *   switch    — same tier, different cadence (monthly ↔ annual).
 *               Useful affordance (annual saves money) but framed
 *               as "Switch to annual" not "Purchase".
 *   upgrade   — recommended next step (free → studio_monthly).
 *   available — sensible purchase given current plan (free user
 *               topping up credits via Indie / Pro packs).
 *   redundant — user's plan supersedes this pack (Studio/Lifetime
 *               looking at one-off credit packs). Disable the CTA
 *               and explain rather than letting them buy something
 *               they don't need.
 */
export type PackRelevance =
  | "current"
  | "switch"
  | "upgrade"
  | "available"
  | "redundant";

/** Known pack ids on the /billing page. */
export type PackId =
  | "indie"
  | "pro"
  | "studio_monthly"
  | "studio_annual";

export type BillingStatus = {
  plan:                  BillingPlan;
  balance:               number;
  hasStripeCustomer:     boolean;
  /** True iff plan is studio_monthly or studio_annual — unmetered AI subscription. */
  isStudio:              boolean;
  /** True iff plan is `lifetime` — one-off, recurring monthly grant. */
  isLifetime:            boolean;
  /** Self-serve subscription management is only meaningful for active Stripe subscribers. */
  canManageSubscription: boolean;
  /** Should the credit packs even be shown? Studio + Lifetime users don't need them. */
  showCreditPacks:       boolean;
};

export function billingStatus(user: User, balance: number): BillingStatus {
  const plan              = user.plan as BillingPlan;
  const isStudio          = plan === "studio_monthly" || plan === "studio_annual";
  const isLifetime        = plan === "lifetime";
  const hasStripeCustomer = Boolean(user.stripeCustomerId);
  return {
    plan,
    balance,
    hasStripeCustomer,
    isStudio,
    isLifetime,
    // Only active Studio subscribers can manage via the Stripe
    // portal — Lifetime is non-recurring, Free has nothing to
    // manage. Stripe customer id must exist (the route returns
    // `no_stripe_customer` otherwise).
    canManageSubscription: isStudio && hasStripeCustomer,
    // Credit packs are noise for unmetered subscribers; we keep the
    // section but mark each pack `redundant` rather than hiding it
    // entirely (so the UI can explain instead of going silent).
    showCreditPacks: !isStudio && !isLifetime,
  };
}

/**
 * Compute relevance of a single pack to the current billing status.
 * Pure. Drives both the PurchaseButton render state and per-pack
 * `data-pack-relevance` attribute for e2e assertions.
 */
export function packRelevance(status: BillingStatus, packId: PackId): PackRelevance {
  // Lifetime tops everything — every pack is redundant.
  if (status.isLifetime) return "redundant";

  if (status.isStudio) {
    // Exact-match subscription = current. The user is on this plan
    // already; the purchase button should disable rather than letting
    // Stripe create a duplicate sub (which it would refuse anyway
    // but we shouldn't dispatch the request).
    if (packId === "studio_monthly" && status.plan === "studio_monthly") return "current";
    if (packId === "studio_annual"  && status.plan === "studio_annual")  return "current";

    // Cross-cadence switch within Studio — both directions are real
    // user actions (annual saves money; monthly is more flexible).
    // The Stripe checkout flow already supports plan changes; the
    // button just needs honest copy.
    if (packId === "studio_monthly" || packId === "studio_annual") return "switch";

    // Indie / Pro one-off credit packs are redundant for unmetered
    // Studio subscribers. Disable + explain.
    return "redundant";
  }

  // Free user — Indie/Pro top up credits; Studio* upgrades the plan.
  if (packId === "studio_monthly" || packId === "studio_annual") return "upgrade";
  return "available";
}

/**
 * Short label rendered on the disabled/relabeled purchase button.
 * Keeps copy centralized so /billing and PurchaseButton stay aligned.
 */
export function packCtaLabel(relevance: PackRelevance): string {
  switch (relevance) {
    case "current":   return "Current plan";
    case "switch":    return "Switch ›";
    case "upgrade":   return "Upgrade ›";
    case "available": return "Purchase ›";
    case "redundant": return "Already covered";
  }
}

export function packCtaHelp(relevance: PackRelevance): string | null {
  switch (relevance) {
    case "current":   return "You're on this subscription. Use Manage subscription to change billing.";
    case "switch":    return "Same tier, different cadence. Stripe will prorate the difference.";
    case "upgrade":   return "Unmetered AI + public API + priority render queue.";
    case "available": return null;
    case "redundant": return "Your current plan already covers this. Credit packs are useful for free-tier users.";
  }
}
