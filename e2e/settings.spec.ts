import { test, expect } from "@playwright/test";

/**
 * /settings contract — cycle #11 (2026-05-23).
 *
 * Before cycle #11, /settings rendered three "soon" dead controls:
 *   - Profile section: `Save profile · soon` (always disabled, no
 *     route behind it)
 *   - Studio API section: fake `sk_live_••••` API key + webhook secret
 *     (no rotate / save path)
 *   - ASC section: full Issuer ID / Key ID / .p8 credential form with
 *     a permanently-disabled `Verify and save · soon` button — the
 *     worst-case dead control, since a user could paste real .p8
 *     cryptographic material into a form that drops it on submit.
 *
 * Cycle #11 ships the profile save path for real (Drizzle migration
 * adds display_name / handle / bio columns; /api/settings/profile
 * persists patches; the form tracks dirty state + idle / saving /
 * saved / error). The Studio API and ASC sections become honest v1.1
 * status surfaces — no fake inputs, no disabled-action illusions.
 *
 * Every section exposes `data-settings-section` so structure can be
 * pinned independently of copy. ASC + API exposes
 * `data-asc-status="planned"` / `data-api-status="planned"` so the
 * future verify flow can advance through the same hook.
 */

test.describe("/settings contract", () => {
  test("exposes data-settings-section for all four sections", async ({ page }) => {
    await page.goto("/settings");
    // Pin structure independently of copy.
    await expect(page.locator('[data-settings-section="profile"]')).toBeVisible();
    await expect(page.locator('[data-settings-section="api"]')).toBeVisible();
    await expect(page.locator('[data-settings-section="asc"]')).toBeVisible();
    await expect(page.locator('[data-settings-section="danger"]')).toBeVisible();
  });

  test("ASC section is an honest planned surface — no fake credential form", async ({ page }) => {
    await page.goto("/settings");
    const asc = page.locator('[data-settings-section="asc"]');
    // The honest status hook. The visible body copy was softened in
    // the post-ship redesign (less repeated v1.1 mentions in primary
    // UX) — the data-asc-status="planned" hook is the canonical
    // contract for "this surface is not live yet".
    await expect(asc.locator('[data-asc-status="planned"]')).toBeVisible();
    // The pre-cycle-11 fake form must be gone.
    await expect(asc.locator('input[name="issuerId"]')).toHaveCount(0);
    await expect(asc.locator('input[name="keyId"]')).toHaveCount(0);
    await expect(asc.locator('textarea[name="privateKey"]')).toHaveCount(0);
    await expect(asc.locator('button:has-text("Verify and save")')).toHaveCount(0);
  });

  test("Studio API section is an honest planned surface — no fake API key display", async ({ page }) => {
    await page.goto("/settings");
    const api = page.locator('[data-settings-section="api"]');
    // The E2E user is on the free plan so this renders the locked CTA.
    // Either status is acceptable — both indicate the surface is
    // not yet live.
    const statusEl = api.locator('[data-api-status]');
    await expect(statusEl).toBeVisible();
    const status = await statusEl.getAttribute("data-api-status");
    expect(["planned", "locked"]).toContain(status);
    // The pre-cycle-11 fake key + rotate / copy buttons are gone.
    await expect(api.locator('input[name="apiKey"]')).toHaveCount(0);
    await expect(api.locator('input[name="webhookSecret"]')).toHaveCount(0);
  });

  test("profile form: pristine state — no dirty markers, save button disabled", async ({ page }) => {
    await page.goto("/settings");
    const profile = page.locator('[data-settings-section="profile"]');
    const form    = profile.locator("form[data-profile-status]");
    await expect(form).toHaveAttribute("data-profile-status", "idle");
    await expect(form).toHaveAttribute("data-profile-dirty", "false");
    // Save button exists, but is disabled in pristine state.
    const save = form.locator('[data-profile-save="true"]');
    await expect(save).toBeDisabled();
    // No `coming soon` lie left over.
    await expect(save).not.toContainText(/soon/i);
  });

  test("profile form: dirty-state detection unlocks the save button", async ({ page }) => {
    await page.goto("/settings");
    const profile = page.locator('[data-settings-section="profile"]');
    const form    = profile.locator("form[data-profile-status]");
    const name    = form.locator('input[name="displayName"]');
    const save    = form.locator('[data-profile-save="true"]');

    await expect(save).toBeDisabled();
    await name.fill("Cycle Eleven Test");
    // Dirty flips immediately on input change.
    await expect(form).toHaveAttribute("data-profile-dirty", "true");
    await expect(form).toHaveAttribute("data-profile-status", "dirty");
    await expect(save).toBeEnabled();
  });

  test("profile form: persists across reload (real save path, not a lie)", async ({ page }) => {
    // Use a deterministic unique value so this spec is order-independent
    // and doesn't conflict with a re-run.
    const value = `Cycle 11 — ${Date.now()}`;

    await page.goto("/settings");
    const profile = page.locator('[data-settings-section="profile"]');
    const form    = profile.locator("form[data-profile-status]");
    const name    = form.locator('input[name="displayName"]');
    const save    = form.locator('[data-profile-save="true"]');

    await name.fill(value);
    await save.click();

    // Watch for the saved acknowledgment via the status attribute.
    await expect(form).toHaveAttribute("data-profile-status", "saved", { timeout: 10_000 });
    await expect(form).toHaveAttribute("data-profile-dirty", "false");
    // Re-disabled now that the snapshot matches.
    await expect(save).toBeDisabled();

    // Reload and verify the persisted value re-renders from Postgres.
    await page.reload();
    const reloadedName = page.locator('[data-settings-section="profile"] input[name="displayName"]');
    await expect(reloadedName).toHaveValue(value);
  });

  test("profile form: invalid handle keeps save disabled with an inline error", async ({ page }) => {
    await page.goto("/settings");
    const profile = page.locator('[data-settings-section="profile"]');
    const form    = profile.locator("form[data-profile-status]");
    const handle  = form.locator('input[name="handle"]');
    const save    = form.locator('[data-profile-save="true"]');

    // Type an invalid handle (whitespace is disallowed).
    await handle.fill("not allowed");

    // Form is dirty AND invalid → save must stay disabled, an inline
    // error must surface.
    await expect(form).toHaveAttribute("data-profile-dirty", "true");
    await expect(save).toBeDisabled();
    await expect(form).toContainText(/letters.*digits/i);
  });

  test("no `Save profile · soon` lie remains on the profile save button", async ({ page }) => {
    await page.goto("/settings");
    // The pre-cycle-11 button literally said "Save profile · soon" and
    // carried aria-label="Save profile — coming soon". Pin its absence
    // on the actual button — the danger-zone "Request export · soon"
    // and "Delete · soon" buttons are intentionally still there and
    // honestly labelled.
    const profileSave = page.locator(
      '[data-settings-section="profile"] [data-profile-save="true"]',
    );
    await expect(profileSave).toBeVisible();
    await expect(profileSave).not.toContainText(/soon/i);
    const ariaLabel = await profileSave.getAttribute("aria-label");
    expect(ariaLabel ?? "").not.toMatch(/coming soon/i);
  });
});
