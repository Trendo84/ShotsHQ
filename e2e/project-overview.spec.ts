import { test, expect } from "@playwright/test";
import path from "node:path";

/**
 * Project overview truthfulness — cycle #4 (2026-05-23).
 *
 * Browser audit found the overview at /projects/[id] hardcoding
 *   - "Shot grid · 0 / 24 slots"
 *   - 8 empty placeholder tiles
 *   - "◯ READY" on every target row
 * regardless of real project state. This spec exercises the page
 * across the three real states (empty / drafting / ready) and
 * pins each contract.
 *
 * Auth + construction-gate bypass via playwright.config.ts webServer.env.
 * Real R2 uploads for the ready-state test (same path as cycle #3).
 */

/**
 * Test fixture project. We pick **iPhone 16 Pro Max** (required 1290×2796
 * → iphone_69) deliberately so the default Studio panel — which seeds
 * to iphone_69 — matches one of the project's targets. That lets the
 * "drafting" scenario assert a meaningful target-row status without
 * also having to drive the device-class switcher in Studio. iPad Pro 13
 * stays as the always-untargeted-by-studio control case.
 */
async function createProject(
  request: import("@playwright/test").APIRequestContext,
  name:    string,
): Promise<string> {
  const res = await request.post("/api/projects", {
    data: {
      name,
      appName:        "Overview",
      appDescription: "Cycle 4 overview smoke",
      category:       "",
      storeTargets:   ["iphone-16-pro-max", "ipad-pro-13-m4"],
    },
  });
  const body = await res.text();
  if (!res.ok()) {
    throw new Error(`createProject failed: HTTP ${res.status()} — ${body.slice(0, 240)}`);
  }
  const json = JSON.parse(body) as { ok: true; data: { id: string } };
  return json.data.id;
}

const FIXTURE = path.join(__dirname, "fixtures", "iphone-69.png");

test.describe("Project overview truthfulness", () => {
  test("empty project: no fake grid, no fake READY, next action = upload-in-studio", async ({ page, request }) => {
    const projectId = await createProject(request, "overview-empty");
    await page.goto(`/projects/${projectId}`);

    // 1. No "0 / 24 slots" lie. The new shot-grid header reads "no
    //    panels yet" (or "X / Y ready") and exposes both counts via
    //    data attributes.
    const gridCount = page.locator('[data-shot-grid-total]').first();
    await expect(gridCount).toHaveAttribute("data-shot-grid-total", "0");
    await expect(gridCount).toHaveAttribute("data-shot-grid-ready", "0");
    await expect(gridCount).toContainText(/no panels yet/i);

    // 2. The 8 hardcoded EmptyTile placeholders are gone — the
    //    page now renders an explicit empty state.
    await expect(page.locator('[data-shot-grid-empty="true"]')).toBeVisible();
    await expect(page.locator('[data-shot-grid-empty="true"]')).toContainText(/no panels yet/i);

    // 3. Each target row exposes its real status via data-target-
    //    status. A freshly-created project has zero panels for each
    //    target — status must be "untargeted-by-studio", NOT "ready".
    const targets = page.locator("[data-target-id]");
    await expect(targets).toHaveCount(2);
    for (const targetId of ["iphone-16-pro-max", "ipad-pro-13-m4"]) {
      const row = page.locator(`[data-target-id="${targetId}"]`);
      await expect(row).toHaveAttribute("data-target-status", "untargeted-by-studio");
      await expect(row).toHaveAttribute("data-target-ready", "0");
      await expect(row).toHaveAttribute("data-target-total", "0");
      // Crucially, never the word "READY" in the row text for an
      // empty project. "TARGETED" is the honest label.
      await expect(row).not.toContainText(/\bREADY\b/);
    }

    // 4. Project status badge is DRAFT (matches readiness=empty —
    //    no persisted Studio state yet). The shared status data
    //    attribute exposes the empty enum value.
    await expect(page.locator('[data-project-status="empty"]').first()).toBeVisible();

    // 5. Next-action CTA matches the state. Empty project → upload
    //    in Studio (or "add-targets-in-studio" — both link to studio).
    const cta = page.locator("[data-next-action]");
    await expect(cta).toBeVisible();
    const nextActionId = await cta.getAttribute("data-next-action");
    expect(["upload-in-studio", "add-targets-in-studio"]).toContain(nextActionId);
    await expect(cta).toHaveAttribute("href", `/projects/${projectId}/studio`);
  });

  test("drafting project: panel exists with no screenshot, status=DRAFTING, target row honest", async ({ page, request }) => {
    // Drive Studio to create one panel (the default panel shows up
    // automatically when Studio mounts the first time and persists on
    // autosave). We open Studio, wait for the saved-state indicator
    // to confirm the default panel hit the DB, then go back to
    // overview.
    const projectId = await createProject(request, "overview-drafting");
    await page.goto(`/projects/${projectId}/studio`);
    // Trigger any state change so autosave runs — write to the
    // headline so the dirty → saved cycle fires.
    const headlineField = page.locator("textarea").first();
    await expect(headlineField).toBeVisible();
    await headlineField.fill("Drafting overview test");
    await expect(page.locator("text=/^Saved$/").first()).toBeVisible({ timeout: 15_000 });

    // Now open the overview for the same project.
    await page.goto(`/projects/${projectId}`);

    // The shot grid reports 1 / 0 (one panel exists, zero ready).
    const grid = page.locator('[data-shot-grid-total]').first();
    await expect(grid).toHaveAttribute("data-shot-grid-total", "1");
    await expect(grid).toHaveAttribute("data-shot-grid-ready", "0");
    await expect(grid).toContainText(/0 \/ 1 ready/);

    // The single panel tile shows ○ DRAFT, not ● READY.
    const tile = page.locator("[data-panel-id]").first();
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute("data-panel-ready", "false");
    await expect(tile).toContainText(/DRAFT/);

    // The target row for the panel's device — iPhone 16 Pro Max
    // (catalog) maps via storeTargetForCatalogId to iphone_69
    // (required 1290×2796), which matches Studio's auto-seeded
    // default device. So the panel counts under the iPhone row.
    // The other target (iPad) has no panel and is still
    // untargeted-by-studio.
    const iphoneRow = page.locator('[data-target-id="iphone-16-pro-max"]');
    await expect(iphoneRow).toHaveAttribute("data-target-status", "drafting");
    await expect(iphoneRow).toContainText(/DRAFTING/);

    const ipadRow = page.locator('[data-target-id="ipad-pro-13-m4"]');
    await expect(ipadRow).toHaveAttribute("data-target-status", "untargeted-by-studio");

    // Project badge reflects in-progress / draft state, not READY.
    await expect(page.locator('[data-project-status]').first()).not.toHaveAttribute("data-project-status", "ready");
  });

  test("ready project: screenshot uploaded + saved → overview shows READY status + open-exports CTA", async ({ page, request }) => {
    const projectId = await createProject(request, "overview-ready");
    await page.goto(`/projects/${projectId}/studio`);

    // Upload a real screenshot through the cycle-#3 server-side path.
    await page.locator('[data-testid="studio-upload-input"]').setInputFiles(FIXTURE);
    await expect(
      page.locator('[data-active-panel-screenshot-remote="true"]').first(),
    ).toBeVisible({ timeout: 30_000 });

    // Wait for autosave to land the durable URL into polotnoJson.
    await expect(page.locator("text=/^Saved$/").first()).toBeVisible({ timeout: 15_000 });

    // Visit overview — page is server-rendered and re-reads
    // polotnoJson.studio with the durable URL + screenshotRemote=true.
    await page.goto(`/projects/${projectId}`);

    // Shot grid reports 1 / 1.
    const grid = page.locator('[data-shot-grid-total]').first();
    await expect(grid).toHaveAttribute("data-shot-grid-total", "1");
    await expect(grid).toHaveAttribute("data-shot-grid-ready", "1");
    await expect(grid).toContainText(/1 \/ 1 ready/);

    // Panel tile is data-panel-ready="true" and renders an <img>
    // with the persisted screenshot URL.
    const tile = page.locator('[data-panel-ready="true"]').first();
    await expect(tile).toBeVisible();
    await expect(tile.locator("img")).toBeVisible();

    // Project badge is READY.
    await expect(page.locator('[data-project-status="ready"]').first()).toBeVisible();

    // Next action flips to "open-exports" and the href points to
    // /exports, not /studio.
    const cta = page.locator("[data-next-action]");
    await expect(cta).toHaveAttribute("data-next-action", "open-exports");
    await expect(cta).toHaveAttribute("href", `/projects/${projectId}/exports`);
  });
});
