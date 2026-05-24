import { test, expect } from "@playwright/test";

/**
 * Wizard navigation regression spec.
 *
 * Post-ship-finish update: the wizard header was rewritten from
 * "Step 02 · Device targets / Pick the / devices." + a right-rail
 * step list with "02 · STORE TARGETS" buttons to a compact inline
 * stepper with "About / Devices / Upload" labels and a "Step N of 3"
 * eyebrow. The internal-project-name disclosure now reads "Internal
 * project name" instead of "Advanced". This spec tracks the new copy
 * — the contract (one required field on step 1, a 3-step nav, a
 * commit that opens Studio) is unchanged.
 */

test.describe("New project wizard navigation", () => {
  test("step 01 → step 02 → step 03 → commit", async ({ page }) => {
    await page.goto("/projects/new");

    // Step 1 → 2. Only App name is required (the internal slug
    // auto-derives via the "Internal project name" disclosure).
    await page.locator("#app-name").fill("Tideline");
    // Use the enabled Next button (locator chain pins one of multiple
    // potential matches; the inline stepper labels are "About /
    // Devices / Upload" so they don't collide with "Next").
    await page.getByRole("button", { name: "Next", exact: true }).click();

    await expect(page.getByText(/Step 2 of 3/).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Pick the devices/ })).toBeVisible();
    await expect(page.getByPlaceholder(/Filter devices/)).toBeVisible();

    // Step 2 → 3
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText(/Step 3 of 3/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^Commit/ })).toBeVisible();

    // Commit creates the project, activates the dropzone, surfaces
    // the "Open studio" CTA on the right rail.
    await page.getByRole("button", { name: /^Commit/ }).click();
    await expect(
      page.getByRole("button", { name: /Open studio/ }),
    ).toBeVisible({ timeout: 15_000 });

    await Promise.all([
      page.waitForURL(/\/projects\/[a-f0-9-]+(?:\/.*)?$/, { timeout: 15_000 }),
      page.getByRole("button", { name: /Open studio/ }).click(),
    ]);
  });

  test("stepper buttons are clickable from any step", async ({ page }) => {
    await page.goto("/projects/new");
    await page.locator("#app-name").fill("Test");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // On step 3 — click the Devices step button in the inline stepper.
    await page.getByRole("button", { name: /Devices/i }).first().click();
    await expect(page.getByPlaceholder(/Filter devices/)).toBeVisible();

    // Click the About step button.
    await page.getByRole("button", { name: /About/i }).first().click();
    await expect(page.locator("#app-name")).toBeVisible();
  });

  test("step 01: internal project name auto-derives from app name", async ({ page }) => {
    await page.goto("/projects/new");
    await page.locator("#app-name").fill("Tideline");
    // Open the "Internal project name" disclosure (was "Advanced" pre
    // post-ship redesign; copy changed in the wizard rewrite).
    await page.getByRole("button", { name: /Internal project name/ }).click();
    const internal = page.locator("#project-name");
    await expect(internal).toBeVisible();
    await expect(internal).toHaveValue("tideline-launch");
  });
});

// TODO(v1.1): extend with editor save round-trip, AI dispatch happy path,
// Stripe checkout smoke. The single skipped scenario in the editor smoke
// (STEP 4 — text:changed → broadcast verification) requires a Fabric-aware
// test hook. Tracked in `docs/issues/v1.1-playwright-auth-bypass.md` (now
// Shipped) and the `Future work` section there.
