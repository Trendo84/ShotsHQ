import { test, expect } from "@playwright/test";

/**
 * /projects/[id]/ai contract — cycle #12 (2026-05-23).
 *
 * Before cycle #12, the AI panel had two material lies:
 *
 *   1. Header claimed "Three modules. One credit ledger." while four
 *      sections actually rendered (Copy + AI backdrop-disabled +
 *      Template set + Translate) and the pricing page advertised five
 *      modules (the five live + planned in lib/utils/credits.ts).
 *   2. The Restyle module backend was fully shipped — POST /api/ai/restyle
 *      with Zod validation, the aiRestyle Trigger.dev task with debit +
 *      Flux call + Stripe meter + automatic refund on failure — but
 *      there was zero UI surface for it. The user could not invoke a
 *      module that pricing markets as a 3 cr/gen feature.
 *
 * Cycle #12 added the Restyle dispatch UI (reference URL + prompt +
 * device + dispatch), corrected the header copy to "Four live modules"
 * with an explicit v1.1 callout for AI backdrop, and pinned the
 * testability contract via `data-ai-module` / `data-ai-status` /
 * `data-ai-cost` on every section.
 *
 * This spec doesn't dispatch a real run (Flux + gpt-image-1 calls cost
 * real money and slow the suite to minutes). It pins:
 *   - all five module sections exist with the right data attributes
 *   - the four live modules start in `data-ai-status="idle"`
 *   - AI backdrop is `data-ai-status="planned"` (v1.1)
 *   - the Restyle module's dispatch button enables only when the form
 *     is valid — same dirty-state pattern as the cycle #11 profile form
 *   - the credit cost on each section matches lib/utils/credits.ts
 */

async function createProject(
  request: import("@playwright/test").APIRequestContext,
  name:    string,
): Promise<string> {
  const res = await request.post("/api/projects", {
    data: {
      name,
      appName:        "Test",
      appDescription: "An app for testing the AI panel.",
      category:       "Productivity",
      storeTargets:   ["iphone-17-pro-max"],
    },
  });
  expect(res.ok()).toBe(true);
  const json = (await res.json()) as { ok: true; data: { id: string } };
  return json.data.id;
}

test.describe("/projects/[id]/ai contract", () => {
  test("all five module sections exist with the right data attributes", async ({ page, request }) => {
    const projectId = await createProject(request, "ai-panel-modules");
    await page.goto(`/projects/${projectId}/ai`);

    // Each module exposes data-ai-module independently of copy.
    await expect(page.locator('[data-ai-module="copy"]')).toBeVisible();
    await expect(page.locator('[data-ai-module="backdrop"]')).toBeVisible();
    await expect(page.locator('[data-ai-module="template-set"]')).toBeVisible();
    await expect(page.locator('[data-ai-module="restyle"]')).toBeVisible();
    await expect(page.locator('[data-ai-module="translate"]')).toBeVisible();
  });

  test("live modules start in idle, AI backdrop is the only `planned` surface", async ({ page, request }) => {
    const projectId = await createProject(request, "ai-panel-statuses");
    await page.goto(`/projects/${projectId}/ai`);

    // The four live modules report idle on first paint.
    await expect(page.locator('[data-ai-module="copy"]')).toHaveAttribute("data-ai-status", "idle");
    await expect(page.locator('[data-ai-module="template-set"]')).toHaveAttribute("data-ai-status", "idle");
    await expect(page.locator('[data-ai-module="restyle"]')).toHaveAttribute("data-ai-status", "idle");
    await expect(page.locator('[data-ai-module="translate"]')).toHaveAttribute("data-ai-status", "idle");

    // AI backdrop reports planned — the only v1.1 surface in the panel.
    await expect(page.locator('[data-ai-module="backdrop"]')).toHaveAttribute("data-ai-status", "planned");
  });

  test("credit costs on each section match lib/utils/credits.ts", async ({ page, request }) => {
    const projectId = await createProject(request, "ai-panel-costs");
    await page.goto(`/projects/${projectId}/ai`);

    // CREDIT_COST source-of-truth values pinned at the section level.
    await expect(page.locator('[data-ai-module="copy"]')).toHaveAttribute("data-ai-cost", "1");
    await expect(page.locator('[data-ai-module="backdrop"]')).toHaveAttribute("data-ai-cost", "2");
    await expect(page.locator('[data-ai-module="template-set"]')).toHaveAttribute("data-ai-cost", "8");
    await expect(page.locator('[data-ai-module="restyle"]')).toHaveAttribute("data-ai-cost", "3");
    // Translate cost = active locales count; the default selection has 7 locales selected.
    const translateCost = await page
      .locator('[data-ai-module="translate"]')
      .getAttribute("data-ai-cost");
    expect(Number(translateCost ?? "0")).toBeGreaterThan(0);
  });

  test("header copy matches the actual module count — no `Three modules` lie", async ({ page, request }) => {
    const projectId = await createProject(request, "ai-panel-header");
    await page.goto(`/projects/${projectId}/ai`);

    // The pre-cycle-12 lie was an H1 reading "Three modules." with four
    // sections actually rendering and five marketed.
    const body = page.locator('body');
    await expect(body).not.toContainText(/^Three modules\.?/i);
    await expect(body).toContainText(/Four live modules/i);
    await expect(body).toContainText(/v1\.1/i); // backdrop callout
  });

  test("Restyle dispatch button: disabled when invalid, enabled when ref URL + prompt valid", async ({ page, request }) => {
    const projectId = await createProject(request, "ai-panel-restyle-dispatch");
    await page.goto(`/projects/${projectId}/ai`);

    const section  = page.locator('[data-ai-module="restyle"]');
    const refInput = section.locator('#ai-restyle-ref');
    const prompt   = section.locator('#ai-restyle-prompt');
    const dispatch = section.locator('[data-ai-dispatch="restyle"]');

    // Empty → disabled.
    await expect(dispatch).toBeDisabled();

    // Invalid URL → still disabled.
    await refInput.fill("not-a-url");
    await prompt.fill("warm editorial palette, soft natural light");
    await expect(dispatch).toBeDisabled();

    // Valid URL + valid prompt → enabled, ready to dispatch.
    await refInput.fill("https://example.com/reference.png");
    await expect(dispatch).toBeEnabled();

    // Clear prompt → disabled again.
    await prompt.fill("");
    await expect(dispatch).toBeDisabled();
  });

  test("Restyle module exposes the device-radio contract (radiogroup + data-active flip)", async ({ page, request }) => {
    const projectId = await createProject(request, "ai-panel-restyle-device");
    await page.goto(`/projects/${projectId}/ai`);

    const section = page.locator('[data-ai-module="restyle"]');
    // Default selection is iphone_69 — matches the store-targets default.
    await expect(section.locator('[data-restyle-device="iphone_69"]')).toHaveAttribute("data-active", "true");
    await expect(section.locator('[data-restyle-device="iphone_67"]')).toHaveAttribute("data-active", "false");
    await expect(section.locator('[data-restyle-device="ipad_13"]')).toHaveAttribute("data-active", "false");

    // Clicking iPad flips it active and peers inactive — matches the
    // cycle-#8 selected-state contract.
    await section.locator('[data-restyle-device="ipad_13"]').click();
    await expect(section.locator('[data-restyle-device="ipad_13"]')).toHaveAttribute("data-active", "true");
    await expect(section.locator('[data-restyle-device="iphone_69"]')).toHaveAttribute("data-active", "false");
  });
});
