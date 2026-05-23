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

    // Step 1 → 2. The internal project name is auto-derived from
    // the app name now (morning-finish friction pass — internal slug
    // lives in an "Advanced" disclosure that defaults closed). Only
    // App name is required to advance.
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
    // Capture v1.1: prior "Drop here · soon" placeholder is gone.
    // The dropzone is the actual feature now — disabled until the
    // project is committed (no projectId yet), enabled afterwards.
    await expect(page.getByText(/Drop here\./).first()).toBeVisible();
    await expect(page.getByText(/Commit metadata to enable upload/)).toBeVisible();

    // Commit creates the project but does NOT redirect — it activates
    // the dropzone so the user can drop screens directly. The user
    // then clicks "Skip → Open studio" (or "Open studio →" after
    // capture) to navigate. The Studio pivot renamed the CTA from
    // "Open editor" to "Open studio" — see app/(app)/projects/new/page.tsx.
    const commit = page.getByRole("button", { name: /^Commit/ });
    await commit.click();
    await expect(
      page.getByRole("button", { name: /Open studio/ }),
    ).toBeVisible({ timeout: 15_000 });

    // Now click into the studio.
    await Promise.all([
      page.waitForURL(/\/projects\/[a-f0-9-]+(?:\/.*)?$/, { timeout: 15_000 }),
      page.getByRole("button", { name: /Open studio/ }).click(),
    ]);
  });

  test("right-rail steps are clickable from any step", async ({ page }) => {
    await page.goto("/projects/new");
    await page.locator("#app-name").fill("Test");
    await page.getByRole("button", { name: /^Next/ }).click();
    await page.getByRole("button", { name: /^Next/ }).click();

    // On step 3 — click step 02 in the right rail.
    await page.getByRole("button", { name: /02 · STORE TARGETS/ }).click();
    await expect(page.getByPlaceholder(/Filter devices/)).toBeVisible();

    // Click step 01 in the right rail.
    await page.getByRole("button", { name: /01 · PROJECT METADATA/ }).click();
    // App name is the leading field on Step 1 now; the internal project
    // name lives behind the "Advanced" disclosure.
    await expect(page.locator("#app-name")).toBeVisible();
  });

  test("step 01: internal project name auto-derives from app name", async ({ page }) => {
    await page.goto("/projects/new");
    await page.locator("#app-name").fill("Tideline");
    // Open the Advanced disclosure to reveal the auto-derived slug.
    await page.getByRole("button", { name: /Advanced/ }).click();
    // The internal-name field should now be visible AND prefilled with
    // a kebab-cased derivation of the app name + "-launch" suffix.
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
