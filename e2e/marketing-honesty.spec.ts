import { test, expect } from "@playwright/test";

/**
 * Public-surfaces honesty contract — cycle #10 (2026-05-23).
 *
 * Before cycle #10, several public marketing/docs surfaces promised
 * capabilities that the authenticated app itself labels as v1.1 / soon:
 *
 *   - `/docs/api` presented a live public REST + webhook contract with
 *     mandatory Idempotency-Key, even though `/api/projects/route.ts`
 *     explicitly notes "idempotency is not implemented yet".
 *   - `/docs/asc` + `/docs/export` presented direct App Store Connect
 *     push as the normal current path, even though `/projects/[id]/exports`
 *     labels the ASC button "v1.1".
 *   - Pricing intro + PricingTable Studio plan promised "Cancel anytime
 *     from settings", even though the live affordance is the Stripe
 *     portal on /billing (cycle #9).
 *   - `/tools/web-hero` was marketed as a shipped designer; there's no
 *     editor route behind the CTA.
 *
 * Cycle #10 reworded each surface to lead with what's live and mark
 * future work honestly as v1.1. This spec is the regression net — it
 * doesn't pin every word, but it pins the known-bad phrases so they
 * can't sneak back in, and pins the v1.1 markers so future copy
 * cleanups don't accidentally erase the honesty signal.
 */

test.describe("Public-surfaces honesty contract", () => {
  test("public pages do NOT mount the WIP / pre-launch banner", async ({ page }) => {
    // Overnight redesign: the hazard-stripe `Work in progress · Pre-launch
    // build · Some features still wiring up` banner was unmounted from
    // the root layout. Pin its absence across the four most-visited
    // public surfaces so it can't sneak back in.
    for (const url of ["/", "/pricing", "/docs", "/templates"]) {
      await page.goto(url);
      await expect(
        page.locator('[aria-label="Work in progress notice"]'),
      ).toHaveCount(0);
      await expect(page.locator('body')).not.toContainText(
        /Some features still wiring up/i,
      );
    }
  });

  test("landing-page Reveal sections are visible at first paint (no opacity-0 gaps)", async ({ page }) => {
    // The Reveal component used to start at opacity:0 and rely on
    // IntersectionObserver to flip visible. That meant any user with
    // JS disabled, a slow IO callback, or an ad blocker saw large blank
    // gaps. Reveal now renders visible by default and animates only
    // below-the-fold after mount.
    await page.goto("/");
    // The Templates compact section (now the second block on landing)
    // is the most reliable "did Reveal hide me" signal — the gallery
    // contains the templates eyebrow text.
    await expect(page.locator('text=/Browse all templates/i').first()).toBeVisible();
    // CTA at the bottom — far below the fold; with the fixed Reveal
    // it should still render visible once the user scrolls to it.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // The footer / final CTA renders concrete copy that we can pin.
    await expect(page.locator('body')).toContainText(/Stop designing|Start free|Ship App Store/i);
  });

  test("/pricing does not promise 'cancel from settings'", async ({ page }) => {
    await page.goto("/pricing");
    const body = page.locator("body");
    // The old lie. Stripe portal lives on /billing, not settings.
    await expect(body).not.toContainText(/cancel\s+(any\s+time\s+)?from\s+settings/i);
    // The new honest framing must mention the Stripe portal.
    await expect(body).toContainText(/stripe\s+(billing\s+)?portal/i);
  });

  test("/pricing credit cost table doesn't sell ASC push as live", async ({ page }) => {
    await page.goto("/pricing");
    // The "Export + ASC upload" row used to read as if ASC push was
    // already shipping. Pin the v1.1 marker.
    await expect(page.locator("body")).toContainText(/v1\.1/i);
  });

  test("PricingTable Pro / Studio / Lifetime mark unshipped perks as v1.1", async ({ page }) => {
    await page.goto("/pricing");
    const html = await page.locator("body").textContent();
    if (!html) throw new Error("no body text");
    // If ASC push is listed as a Pro/Lifetime perk, it must read v1.1.
    if (/App Store Connect push/i.test(html)) {
      expect(html).toMatch(/App Store Connect push.*v1\.1/i);
    }
    // If the public API is listed as a Studio/Lifetime perk, it must
    // read v1.1 — the route doesn't enforce the contract yet.
    if (/REST\s*\+\s*webhook API/i.test(html)) {
      expect(html).toMatch(/REST.*webhook API.*v1\.1/i);
    }
  });

  test("/docs index annotates Export pipeline + Public API + ASC as v1.1", async ({ page }) => {
    await page.goto("/docs");
    const body = page.locator("body");
    // Each unreleased subhead must include a v1.1 marker.
    await expect(body).toContainText(/Export pipeline/i);
    await expect(body).toContainText(/Public API/i);
    await expect(body).toContainText(/App Store Connect/i);
    await expect(body).toContainText(/v1\.1/i);
  });

  test("/docs/export marks server queue + ASC push as v1.1 targets", async ({ page }) => {
    await page.goto("/docs/export");
    const body = page.locator("body");
    // Pre-cycle-10 copy claimed server-side render as the normal path.
    // Post-fix, the page must explicitly flag v1.1 for the server queue
    // AND mention Studio renders today (the live path).
    await expect(body).toContainText(/v1\.1/i);
    await expect(body).toContainText(/Studio renders/i);
  });

  test("/docs/api flags the entire public API contract as v1.1", async ({ page }) => {
    await page.goto("/docs/api");
    const body = page.locator("body");
    await expect(body).toContainText(/v1\.1/i);
    await expect(body).toContainText(/not live yet/i);
  });

  test("/docs/asc flags direct ASC push as v1.1", async ({ page }) => {
    await page.goto("/docs/asc");
    const body = page.locator("body");
    await expect(body).toContainText(/v1\.1/i);
    await expect(body).toContainText(/not live yet/i);
  });

  test("/docs/quickstart doesn't claim direct-to-R2 uploads or server-authoritative exports", async ({ page }) => {
    await page.goto("/docs/quickstart");
    const body = page.locator("body");
    // The pre-cycle-10 copy: "uploaded directly to Cloudflare R2 via
    // pre-signed URLs — they never traverse our servers". Studio
    // actually uses the same-origin /api/upload/direct proxy.
    await expect(body).not.toContainText(/never traverse our servers/i);
    // The pre-cycle-10 copy: "The render pipeline is server-authoritative".
    // Server-side render is a v1.1 target.
    await expect(body).not.toContainText(/render pipeline is server-authoritative/i);
    // The corrected copy mentions the same-origin proxy.
    await expect(body).toContainText(/api\/upload\/direct/i);
  });

  test("/tools/web-hero is honestly labelled v1.1 / early access", async ({ page }) => {
    await page.goto("/tools/web-hero");
    const body = page.locator("body");
    // The page must surface a v1.1 marker so visitors don't expect a
    // live designer behind the CTA.
    await expect(body).toContainText(/v1\.1/i);
    // The data-* contract is the stable hook for any future test that
    // wants to assert the status without coupling to copy.
    await expect(page.locator('[data-web-hero-status="early-access"]')).toBeVisible();
  });
});
