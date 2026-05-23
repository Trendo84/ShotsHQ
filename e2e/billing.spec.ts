import { test, expect } from "@playwright/test";

/**
 * /billing readiness contract — cycle #9 (2026-05-23).
 *
 * Before cycle #9, /billing rendered the same pack list to every
 * user regardless of plan. Free users got the same `STUDIO ANNUAL`
 * Purchase button as Studio subscribers; Studio/Lifetime users saw
 * `INDIE PACK $19` / `PRO PACK $49` purchases that don't make sense
 * for unmetered plans. No data attributes for testability, no
 * Manage-subscription affordance.
 *
 * Cycle #9 wires the shared `billingStatus()` + `packRelevance()`
 * helpers in lib/billing/status.ts (13 unit specs). The page +
 * PurchaseButton + new ManageSubscriptionButton render against
 * those enums. This spec pins the rendered contract for the
 * default E2E user (synthetic user is on the `free` plan).
 *
 * The synthetic E2E user is always seeded as plan=free per
 * lib/auth/clerk.ts (E2E_FIXTURE). Studio/Lifetime e2e coverage
 * would require seeding a paid user — out of scope for this cycle,
 * but the unit tests in tests/billing/status.test.ts cover the
 * plan transitions in pure-logic form.
 */

test.describe("/billing readiness contract (free-tier E2E user)", () => {
  test("exposes data-plan-status='free' and per-pack relevance attributes", async ({ page }) => {
    await page.goto("/billing");

    // Top-level wrapper exposes the user's plan as the canonical
    // enum value. Lets the next-most-pessimistic surface (a future
    // billing-aware dashboard nudge, say) derive its own state
    // without duplicating the helper.
    const root = page.locator('[data-plan-status]').first();
    await expect(root).toHaveAttribute("data-plan-status", "free");
    // Free users have no recurring subscription to manage.
    await expect(root).toHaveAttribute("data-can-manage-subscription", "false");

    // The four PLAN / BALANCE / THIS MO. / NEXT BILL stats each
    // expose their own data-stat attribute. PLAN reads FREE for
    // the synthetic user.
    await expect(page.locator('[data-stat="plan"]')).toContainText("FREE");
    await expect(page.locator('[data-stat="balance"]')).toBeAttached();

    // Per-pack relevance for a free user:
    //   indie / pro            → available
    //   studio_monthly/annual  → upgrade
    await expect(page.locator('[data-pack-card="indie"]'))
      .toHaveAttribute("data-pack-relevance", "available");
    await expect(page.locator('[data-pack-card="pro"]'))
      .toHaveAttribute("data-pack-relevance", "available");
    await expect(page.locator('[data-pack-card="studio_monthly"]'))
      .toHaveAttribute("data-pack-relevance", "upgrade");
    await expect(page.locator('[data-pack-card="studio_annual"]'))
      .toHaveAttribute("data-pack-relevance", "upgrade");
  });

  test("PurchaseButton CTAs reflect per-pack relevance (no fake `Purchase` on upgrades)", async ({ page }) => {
    await page.goto("/billing");

    // Indie + Pro are available → buttons say "Purchase ›"
    const indieBtn = page
      .locator('[data-pack-card="indie"] [data-pack-relevance="available"] button');
    await expect(indieBtn).toBeAttached();
    await expect(indieBtn).toContainText(/Purchase/i);
    await expect(indieBtn).toBeEnabled();

    // Studio packs are upgrades → "Upgrade ›" copy
    const studioMonthlyBtn = page
      .locator('[data-pack-card="studio_monthly"] [data-pack-relevance="upgrade"] button');
    await expect(studioMonthlyBtn).toContainText(/Upgrade/i);
    await expect(studioMonthlyBtn).toBeEnabled();

    const studioAnnualBtn = page
      .locator('[data-pack-card="studio_annual"] [data-pack-relevance="upgrade"] button');
    await expect(studioAnnualBtn).toContainText(/Upgrade/i);
    await expect(studioAnnualBtn).toBeEnabled();
  });

  test("free user sees no Manage-subscription button (no Stripe subscription to manage)", async ({ page }) => {
    await page.goto("/billing");
    // The button only renders when billingStatus.canManageSubscription
    // === true. For a free-plan user that's false.
    await expect(page.locator('[data-manage-subscription]')).toHaveCount(0);
  });

  test("no hardcoded 'Current plan' / 'Already covered' badges on a free user", async ({ page }) => {
    await page.goto("/billing");
    // The 'current' and 'redundant' relevance states are paid-user
    // only. Their data attributes must not appear on a free user's
    // /billing render.
    await expect(page.locator('[data-pack-relevance="current"]')).toHaveCount(0);
    await expect(page.locator('[data-pack-relevance="redundant"]')).toHaveCount(0);
  });
});
