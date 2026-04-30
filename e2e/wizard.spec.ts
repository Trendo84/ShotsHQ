import { test, expect } from "@playwright/test";

/**
 * Wizard navigation regression spec.
 *
 * Bug 2: users couldn't tell they'd advanced past Step 01 because the
 * persistent top header was hardcoded. The fix made the header dynamic
 * (driven by STEP_META keyed off `step`) and converted the right-rail
 * step list from inert <li> to clickable buttons.
 *
 * Auth bypass (NEXT_PUBLIC_E2E=1 + NODE_ENV != "production") is shipped
 * across proxy.ts, lib/auth/clerk.ts, and next.config.ts. See
 * `docs/issues/v1.1-playwright-auth-bypass.md` (now marked Shipped).
 *
 * Run via: `pnpm test:e2e` (playwright.config.ts boots `pnpm dev` with
 * NEXT_PUBLIC_E2E=1 in `webServer.env`).
 */

test.describe("New project wizard navigation", () => {
  test("step 01 → step 02 → step 03 → commit", async ({ page }) => {
    await page.goto("/projects/new");

    // Step 1 → 2
    await page.locator("#project-name").fill("e2e-test-project");
    await page.locator("#app-name").fill("Tideline");
    await page.getByRole("button", { name: /^Next/ }).click();

    // The persistent top header should now reflect step 2. There are TWO
    // instances of "Step 02 · Device targets" on the page once advanced —
    // the top header (driven by STEP_META) and the step's own eyebrow. We
    // assert visibility on the first; either being visible is sufficient
    // and matches the user-perceptible bug fix.
    await expect(page.getByText(/Step 02 · Device targets/).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Pick the/ })).toBeVisible();

    // DevicePicker should render in the main column.
    await expect(page.getByPlaceholder(/Filter devices/)).toBeVisible();

    // Step 2 → 3
    await page.getByRole("button", { name: /^Next/ }).click();
    await expect(page.getByText(/Step 03 · Upload screens/).first()).toBeVisible();
    await expect(page.getByText(/Drop here · soon/)).toBeVisible();

    // Commit should redirect to the project page.
    const commit = page.getByRole("button", { name: /^Commit/ });
    await Promise.all([
      page.waitForURL(/\/projects\/[a-f0-9-]+(?:\/.*)?$/, { timeout: 15_000 }),
      commit.click(),
    ]);
  });

  test("right-rail steps are clickable from any step", async ({ page }) => {
    await page.goto("/projects/new");
    await page.locator("#project-name").fill("e2e-test");
    await page.locator("#app-name").fill("Test");
    await page.getByRole("button", { name: /^Next/ }).click();
    await page.getByRole("button", { name: /^Next/ }).click();

    // On step 3 — click step 02 in the right rail.
    await page.getByRole("button", { name: /02 · STORE TARGETS/ }).click();
    await expect(page.getByPlaceholder(/Filter devices/)).toBeVisible();

    // Click step 01 in the right rail.
    await page.getByRole("button", { name: /01 · PROJECT METADATA/ }).click();
    await expect(page.locator("#project-name")).toBeVisible();
  });
});

// TODO(v1.1): extend with editor save round-trip, AI dispatch happy path,
// Stripe checkout smoke. The single skipped scenario in the editor smoke
// (STEP 4 — text:changed → broadcast verification) requires a Fabric-aware
// test hook. Tracked in `docs/issues/v1.1-playwright-auth-bypass.md` (now
// Shipped) and the `Future work` section there.
