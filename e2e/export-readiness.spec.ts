import { test, expect } from "@playwright/test";

/**
 * Export readiness funnel — Studio + /exports consistency.
 *
 * Browser audit (2026-05-23) found that fresh projects with zero
 * uploaded screenshots claimed "EXPORT READY" in Studio and had
 * enabled CTAs that produced no visible result, while /exports
 * separately stayed on "Render now — coming soon" with disabled
 * bundle downloads. The two surfaces lied independently.
 *
 * Fix routes both through a single readiness model
 * (`lib/studio/readiness.ts`). This spec covers:
 *   - empty-project gating: blocked status, disabled CTAs, no
 *     silent no-op
 *   - Studio ↔ /exports consistency: same readiness label across
 *     both surfaces
 *   - the per-panel checklist surfaces in both places when blocked
 */

async function createProject(
  request: import("@playwright/test").APIRequestContext,
  name:    string,
): Promise<string> {
  const res = await request.post("/api/projects", {
    data: {
      name,
      appName:        "Ready",
      appDescription: "",
      category:       "",
      storeTargets:   ["iphone-17-pro-max", "ipad-pro-13-m4"],
    },
  });
  expect(res.ok()).toBe(true);
  const json = (await res.json()) as { ok: true; data: { id: string } };
  return json.data.id;
}

test.describe("Export readiness", () => {
  test("fresh empty project: Studio shows Blocked status + disabled export CTAs", async ({ page, request }) => {
    const projectId = await createProject(request, "export-readiness-empty");
    await page.goto(`/projects/${projectId}/studio`);

    // The Export InfoCell exposes data-status="blocked" via the new
    // readiness model. We anchor on that attribute, not on the
    // rendered "Blocked" text, so test fragility tracks the contract
    // not the surface copy.
    const exportCell = page.locator('[data-status="blocked"]').first();
    await expect(exportCell).toBeVisible();
    await expect(exportCell).toContainText(/Blocked/i);

    // Both CTAs are disabled at the data-attribute layer.
    const exportCurrent = page.locator('[data-export-current-enabled]');
    const exportAll     = page.locator('[data-export-all-enabled]');
    await expect(exportCurrent).toHaveAttribute("data-export-current-enabled", "false");
    await expect(exportAll).toHaveAttribute("data-export-all-enabled", "false");
    await expect(exportCurrent).toBeDisabled();
    await expect(exportAll).toBeDisabled();

    // Readiness callout names the blockers in plain language.
    await expect(page.locator('[data-readiness-status="blocked"]').first()).toBeVisible();
    await expect(page.locator("text=/missing app screenshot/i").first()).toBeVisible();
  });

  test("Exports page reflects the same Blocked status as Studio for the same project", async ({ page, request }) => {
    const projectId = await createProject(request, "export-readiness-consistency");
    await page.goto(`/projects/${projectId}/exports`);

    // The readiness pill on the Exports page exposes the same
    // data-readiness-status as Studio's callout, driven by the same
    // pure reducer. Both must read "blocked" for the same project.
    const exportsStatus = page.locator('[data-readiness-status="blocked"]').first();
    await expect(exportsStatus).toBeVisible();
    await expect(exportsStatus).toContainText(/Blocked/i);

    // The primary CTA is "Prepare in Studio" (not the old "Render
    // now — coming soon" dead button).
    const cta = page.locator('[data-export-cta="open-studio-prepare"]');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText(/Prepare in Studio/i);

    // Now open Studio for the same project and confirm it agrees.
    await page.goto(`/projects/${projectId}/studio`);
    await expect(page.locator('[data-status="blocked"]').first()).toContainText(/Blocked/i);
  });

  test("Studio Export-current button does not silently no-op when active panel is blocked", async ({ page, request }) => {
    const projectId = await createProject(request, "export-readiness-silent-noop");
    await page.goto(`/projects/${projectId}/studio`);

    // The button is `disabled` at the HTML attribute level. Clicking
    // a disabled button is a no-op by browser contract — Playwright
    // also refuses to click disabled elements by default. We assert
    // both:
    //   (a) data-export-current-enabled="false"
    //   (b) tooltip explains what's missing
    const cta = page.locator('[data-export-current-enabled]');
    await expect(cta).toHaveAttribute("data-export-current-enabled", "false");
    const title = await cta.getAttribute("title");
    expect(title).toMatch(/missing/i);
  });

  test("per-panel checklist on /exports lists every panel's blockers", async ({ page, request }) => {
    const projectId = await createProject(request, "export-readiness-checklist");
    await page.goto(`/projects/${projectId}/exports`);

    // For a fresh project with one default panel, the checklist
    // shows that panel as not-ready with the missing-screenshot
    // explanation.
    const panel01 = page.locator('[data-panel-ready="false"]').first();
    await expect(panel01).toBeVisible();
    await expect(panel01).toContainText(/Panel 01/i);
    await expect(panel01).toContainText(/missing app screenshot/i);
  });
});
