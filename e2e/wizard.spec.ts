import { test, expect } from "@playwright/test";

/**
 * Wizard navigation regression spec.
 *
 * Bug 2 from the plan: users couldn't tell they'd advanced past Step 01
 * because the persistent top header was hardcoded. Fix made the header
 * dynamic and the right-rail steps clickable.
 *
 * Currently `test.skip` because:
 *   - `/projects/new` lives inside the `(app)` route group whose layout
 *     calls `requireUser()` (lib/auth/clerk.ts), which hits Clerk.
 *   - Bypassing that without seeding a dummy DB user + stubbing
 *     getBalance is more infrastructure than this pass scoped for.
 *   - The wizard fix is small + verified via the vitest suite +
 *     manual smoke. Real E2E coverage lands in v1.1.
 *
 * To unskip: implement the auth-bypass story (NEXT_PUBLIC_E2E=1 short-
 * circuits requireUser and getBalance), seed a dummy user via Drizzle,
 * then drop the `.skip` calls.
 */

test.describe("New project wizard navigation", () => {
  test.skip("step 01 → step 02 → step 03 → commit", async ({ page }) => {
    await page.goto("/projects/new");

    // Step 1 → 2
    await page.getByLabel(/PROJECT NAME/i).fill("e2e-test-project");
    await page.getByLabel(/APP NAME/i).fill("Tideline");
    await page.getByRole("button", { name: /^Next/ }).click();

    // The persistent top header should now reflect step 2.
    await expect(page.getByText(/Step 02 · Device targets/)).toBeVisible();
    await expect(page.getByText(/Pick the/)).toBeVisible();
    await expect(page.getByText(/devices\./)).toBeVisible();

    // DevicePicker should render in the main column.
    await expect(page.getByPlaceholder(/Filter devices/)).toBeVisible();

    // Step 2 → 3
    await page.getByRole("button", { name: /^Next/ }).click();
    await expect(page.getByText(/Step 03 · Upload screens/)).toBeVisible();
    await expect(page.getByText(/Drop here · soon/)).toBeVisible();

    // Commit should redirect into the editor.
    const commit = page.getByRole("button", { name: /^Commit/ });
    await commit.click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+$/);
  });

  test.skip("right-rail steps are clickable from any step", async ({ page }) => {
    await page.goto("/projects/new");
    await page.getByLabel(/PROJECT NAME/i).fill("e2e-test");
    await page.getByLabel(/APP NAME/i).fill("Test");
    await page.getByRole("button", { name: /^Next/ }).click();
    await page.getByRole("button", { name: /^Next/ }).click();

    // We're on step 3. Click step 02 in the right rail.
    await page.getByRole("button", { name: /02 · STORE TARGETS/ }).click();
    await expect(page.getByPlaceholder(/Filter devices/)).toBeVisible();

    // Click step 01 in the right rail.
    await page.getByRole("button", { name: /01 · PROJECT METADATA/ }).click();
    await expect(page.getByLabel(/PROJECT NAME/i)).toBeVisible();
  });
});

// TODO(v1.1): extend with editor save round-trip, AI dispatch happy path,
// Stripe checkout smoke. Tracking: v1.1 test-suite milestone.
