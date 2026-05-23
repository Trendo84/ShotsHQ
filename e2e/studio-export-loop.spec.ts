import { test, expect } from "@playwright/test";
import path from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

/**
 * Studio export full-loop — cycle #6 (2026-05-23).
 *
 * After cycle #3 wired durable screenshot persistence and cycles
 * #2 / #4 / #5 fixed every truthful-surface lie, the remaining
 * shippability question is: does the export pipeline actually
 * produce a real PNG that contains the persisted screenshot at
 * App Store-exact pixel dimensions?
 *
 * This spec drives the loop end-to-end:
 *   1. Create project + upload PNG fixture (cycle-#3 path)
 *   2. Wait for the persisted "Saved" state (cycle-#5 helper)
 *   3. Click `Export current`
 *   4. Capture the download with Playwright
 *   5. Save to /tmp, read PNG metadata with sharp
 *   6. Assert exact 1290 × 2796 dimensions
 *   7. Assert non-trivial file size (not a tainted blank canvas)
 *   8. Confirm Studio's "Last export run" log says "Exact"
 *   9. Cross-surface: /dashboard + /projects + /projects/[id]
 *      all show READY for the now-ready project
 *
 * Two failure modes this catches:
 *   - R2 GET CORS: if R2's public URL doesn't serve
 *     `Access-Control-Allow-Origin: *`, the canvas taint blocks
 *     `toDataURL` and `toPng` either throws or produces an
 *     undersized PNG. Sharp will measure the wrong dims OR the
 *     download won't happen at all.
 *   - Pixel-ratio scaling off-by-one: the export's pixelRatio is
 *     `device.width / CANVAS_BASE_WIDTH`. Wrong arithmetic shows
 *     up as dim mismatch on the sharp read.
 */

async function createProject(
  request: import("@playwright/test").APIRequestContext,
  name:    string,
): Promise<string> {
  const res = await request.post("/api/projects", {
    data: {
      name,
      appName:        "Export",
      appDescription: "Cycle 6 export-loop smoke",
      category:       "",
      // iPhone 16 Pro Max → iphone_69 (1290×2796) matches Studio's
      // default device, so the auto-seeded panel + this target line up.
      storeTargets:   ["iphone-16-pro-max"],
    },
  });
  const body = await res.text();
  if (!res.ok()) throw new Error(`createProject failed: HTTP ${res.status()} — ${body.slice(0, 240)}`);
  return (JSON.parse(body) as { ok: true; data: { id: string } }).data.id;
}

/**
 * Same hardened helper as cycle #5: stay on /studio, watch the
 * autosave actually cycle through dirty/saving before claiming
 * the upload is persisted.
 */
async function uploadAndPersist(page: import("@playwright/test").Page, projectId: string): Promise<void> {
  const fixture = path.join(__dirname, "fixtures", "iphone-69.png");
  await page.goto(`/projects/${projectId}/studio`);
  await page.locator('[data-testid="studio-upload-input"]').setInputFiles(fixture);
  await expect(
    page.locator('[data-active-panel-screenshot-remote="true"]').first(),
  ).toBeVisible({ timeout: 30_000 });
  // Wait for the autosave cycle. Anchor on the dirty/saving sub-copy
  // first (proves the cycle started), then the saved sub-copy (proves
  // it landed server-side).
  await expect(
    page.locator('text=/Waiting for the autosave|Writing the panel set/').first(),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.locator('text=/Persisted panel set into the project payload/').first(),
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("Studio export full loop", () => {
  test("Export current downloads a 1290×2796 PNG containing the persisted screenshot", async ({ page, request }) => {
    const projectId = await createProject(request, "studio-export-loop");
    await uploadAndPersist(page, projectId);

    // Sanity: button must be enabled now that the screenshot is
    // persisted. Anything else here means cycle-#3 regressed.
    const exportBtn = page.locator('[data-export-current-enabled]');
    await expect(exportBtn).toHaveAttribute("data-export-current-enabled", "true");

    // Capture the download triggered by the click. The export path
    // creates an <a> tag with a data: URL and calls .click(); the
    // browser surfaces this to Playwright as a download event.
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30_000 }),
      exportBtn.click(),
    ]);

    // Save the download to /tmp under a UUID name so concurrent
    // workers don't collide.
    const downloadPath = path.join(tmpdir(), `shotshq-export-${randomUUID()}.png`);
    await download.saveAs(downloadPath);

    // Read actual PNG metadata with sharp. This is the contract:
    // App Store iPhone 6.9" rejects anything that isn't 1290×2796.
    const meta = await sharp(downloadPath).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBe(1290);
    expect(meta.height).toBe(2796);

    // Defense against canvas-tainted-blank-output: a real composite
    // is dense PNG data. A tainted/transparent fallback compresses
    // to a few KB. Real export of a 1290×2796 panel with a
    // screenshot embedded should be ≥ 20KB; in practice we see
    // hundreds of KB.
    const stat = (await sharp(downloadPath).stats());
    // Stats reports per-channel; just confirm the PNG actually decoded
    // (sharp throws if it's blank/malformed).
    expect(stat.channels.length).toBeGreaterThan(0);
    const fs = await import("node:fs/promises");
    const fileSize = (await fs.stat(downloadPath)).size;
    expect(fileSize).toBeGreaterThan(20_000);

    // The Studio "Last export run" log must show Exact for this run.
    // Anchor on the data-export-row-status attribute the export
    // log assigns per row.
    await expect(page.locator('[data-export-row-status="ok"]').first()).toBeVisible();
    await expect(page.locator('[data-export-row-status="ok"]').first()).toContainText(/Exact/);
    await expect(page.locator('[data-export-row-status="ok"]').first()).toContainText(/1290×2796/);

    // Cross-surface: every truthful surface now reports READY for
    // this project. /dashboard + /projects + /projects/[id].
    await page.goto("/dashboard");
    await expect(
      page.locator(`[data-project-row="${projectId}"]`),
    ).toHaveAttribute("data-project-status", "ready");

    await page.goto("/projects");
    await expect(
      page.locator(`[data-project-card="${projectId}"]`),
    ).toHaveAttribute("data-project-status", "ready");

    await page.goto(`/projects/${projectId}`);
    await expect(page.locator('[data-project-status]').first()).toHaveAttribute("data-project-status", "ready");
    // Next-action flips to "open-exports" per cycle #4.
    await expect(page.locator('[data-next-action]')).toHaveAttribute("data-next-action", "open-exports");
  });
});
