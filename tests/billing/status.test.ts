import { describe, expect, it } from "vitest";
import {
  billingStatus,
  packCtaHelp,
  packCtaLabel,
  packRelevance,
  type BillingPlan,
} from "@/lib/billing/status";
import type { User } from "@/lib/db/schema";

/**
 * Pin the cycle-#9 billing-status contract. /billing, PurchaseButton,
 * and the e2e spec all derive from these helpers — if any case below
 * regresses, the live billing page will start lying again.
 */

function fixtureUser(plan: BillingPlan, stripeCustomerId: string | null = "cus_test"): User {
  return {
    id:               "00000000-0000-0000-0000-000000000001",
    clerkId:          "test",
    email:            "test@shotshq.local",
    stripeCustomerId,
    plan,
    creditBalance:    0,
    // Cycle #11 added these columns to the `users` table; pure-logic
    // tests don't exercise them, but the User type requires them.
    displayName:      "",
    handle:           "",
    bio:              "",
    createdAt:        new Date(),
    updatedAt:        new Date(),
  };
}

describe("billingStatus()", () => {
  it("free user with no Stripe customer", () => {
    const s = billingStatus(fixtureUser("free", null), 0);
    expect(s.plan).toBe("free");
    expect(s.isStudio).toBe(false);
    expect(s.isLifetime).toBe(false);
    expect(s.hasStripeCustomer).toBe(false);
    expect(s.canManageSubscription).toBe(false);
    expect(s.showCreditPacks).toBe(true);
  });

  it("free user who has previously purchased a one-off pack (has Stripe customer)", () => {
    const s = billingStatus(fixtureUser("free", "cus_indie123"), 100);
    expect(s.hasStripeCustomer).toBe(true);
    // canManageSubscription requires Studio plan, not just a Stripe customer.
    expect(s.canManageSubscription).toBe(false);
    expect(s.showCreditPacks).toBe(true);
  });

  it("studio_monthly subscriber", () => {
    const s = billingStatus(fixtureUser("studio_monthly"), 0);
    expect(s.isStudio).toBe(true);
    expect(s.canManageSubscription).toBe(true);
    expect(s.showCreditPacks).toBe(false);
  });

  it("studio_annual subscriber", () => {
    const s = billingStatus(fixtureUser("studio_annual"), 0);
    expect(s.isStudio).toBe(true);
    expect(s.canManageSubscription).toBe(true);
    expect(s.showCreditPacks).toBe(false);
  });

  it("studio subscriber without a Stripe customer (shouldn't normally happen) cannot manage", () => {
    const s = billingStatus(fixtureUser("studio_monthly", null), 0);
    expect(s.isStudio).toBe(true);
    expect(s.canManageSubscription).toBe(false);
  });

  it("lifetime user", () => {
    const s = billingStatus(fixtureUser("lifetime"), 50);
    expect(s.isStudio).toBe(false);
    expect(s.isLifetime).toBe(true);
    // Lifetime is non-recurring — nothing to manage via Stripe portal.
    expect(s.canManageSubscription).toBe(false);
    // Lifetime gets a monthly grant; doesn't need top-up packs.
    expect(s.showCreditPacks).toBe(false);
  });
});

describe("packRelevance()", () => {
  it("free user: Indie/Pro are available, Studio* are upgrades", () => {
    const s = billingStatus(fixtureUser("free", null), 0);
    expect(packRelevance(s, "indie")).toBe("available");
    expect(packRelevance(s, "pro")).toBe("available");
    expect(packRelevance(s, "studio_monthly")).toBe("upgrade");
    expect(packRelevance(s, "studio_annual")).toBe("upgrade");
  });

  it("studio_monthly: monthly = current, annual = switch, packs = redundant", () => {
    const s = billingStatus(fixtureUser("studio_monthly"), 0);
    expect(packRelevance(s, "studio_monthly")).toBe("current");
    expect(packRelevance(s, "studio_annual")).toBe("switch");
    expect(packRelevance(s, "indie")).toBe("redundant");
    expect(packRelevance(s, "pro")).toBe("redundant");
  });

  it("studio_annual: annual = current, monthly = switch, packs = redundant", () => {
    const s = billingStatus(fixtureUser("studio_annual"), 0);
    expect(packRelevance(s, "studio_annual")).toBe("current");
    expect(packRelevance(s, "studio_monthly")).toBe("switch");
    expect(packRelevance(s, "indie")).toBe("redundant");
    expect(packRelevance(s, "pro")).toBe("redundant");
  });

  it("lifetime: every pack is redundant", () => {
    const s = billingStatus(fixtureUser("lifetime"), 0);
    expect(packRelevance(s, "indie")).toBe("redundant");
    expect(packRelevance(s, "pro")).toBe("redundant");
    expect(packRelevance(s, "studio_monthly")).toBe("redundant");
    expect(packRelevance(s, "studio_annual")).toBe("redundant");
  });

  it("never returns the same relevance for current + non-current of the same plan", () => {
    // Sanity check: current Studio monthly user looking at the
    // monthly pack gets "current"; same user looking at the annual
    // pack gets "switch". They must differ to keep the UI honest.
    const s = billingStatus(fixtureUser("studio_monthly"), 0);
    expect(packRelevance(s, "studio_monthly")).not.toBe(packRelevance(s, "studio_annual"));
  });
});

describe("packCtaLabel() + packCtaHelp()", () => {
  it("produces a label for every relevance", () => {
    expect(packCtaLabel("current")).toBe("Current plan");
    expect(packCtaLabel("switch")).toBe("Switch ›");
    expect(packCtaLabel("upgrade")).toBe("Upgrade ›");
    expect(packCtaLabel("available")).toBe("Purchase ›");
    expect(packCtaLabel("redundant")).toBe("Already covered");
  });

  it("returns help copy for non-available relevances; null for the default `available` case", () => {
    expect(packCtaHelp("available")).toBeNull();
    expect(packCtaHelp("current")).toMatch(/Manage subscription/i);
    expect(packCtaHelp("switch")).toMatch(/prorate/i);
    expect(packCtaHelp("upgrade")).toMatch(/Unmetered/i);
    expect(packCtaHelp("redundant")).toMatch(/already covers/i);
  });
});
