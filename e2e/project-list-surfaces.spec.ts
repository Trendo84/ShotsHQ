import { test, expect } from "@playwright/test";
import path from "node:path";

/**
 * Project-list truthfulness — cycle #5 (2026-05-23).
 *
 * Browser audit found both /dashboard and /projects hardcoding
 *   <Badge>Draft</Badge> / <Badge>DRAFT</Badge>
 * on every project row/card regardless of real state. After cycle #4
 * fixed /projects/[id], the list surfaces were the last lie standing.
 *
 * Fix: both surfaces now derive status from the shared
 * `projectStatus()` reducer in `lib/studio/project-status.ts`, exactly
 * matching the truth Studio + /exports + the overview already use.
 *
 * This spec drives both surfaces across the empty-and-ready states.
 * Creating a "ready" project means doing the cycle-#3 upload loop
 * (PNG fixture → /api/upload/direct → autosave persists the durable
 * URL into polotnoJson). The list pages read the same persisted blob.
 */

async function createProject(
  request: import("@playwright/test").APIRequestContext,
  name:    string,
): Promise<string> {
  const res = await request.post("/api/projects", {
    data: {
      name,
      appName:        "List",
      appDescription: "Cycle 5 list-surface smoke",
      category:       "",
      storeTargets:   ["iphone-16-pro-max"], // maps to iphone_69, matches Studio default
    },
  });
  const body = await res.text();
  if (!res.ok()) {
    throw new Error(`createProject failed: HTTP ${res.status()} — ${body.slice(0, 240)}`);
  }
  const json = JSON.parse(body) as { ok: true; data: { id: string } };
  return json.data.id;
}

/**
 * Drive Studio to upload a real screenshot for the project's first
 * panel and wait until autosave **definitively** persists the
 * durable URL.
 *
 * Why this is harder than it looks: Studio's "Saved" indicator is
 * the InfoCell's *initial state* (before any dirty cycle), so we
 * cannot just wait for "Saved" to become visible. We must observe
 * the dirty → saving → saved cycle actually happening, while staying
 * on /studio so the React unmount on navigation doesn't cancel the
 * in-flight save timer.
 *
 * Strategy:
 *   1. Upload PNG via the hidden file input.
 *   2. Wait for screenshotRemote=true (swap blob → R2 URL completed).
 *   3. Wait for the persistence-cell sub-text to read "Writing the
 *      panel set to the project" — that's saveHelp() for the
 *      "saving" state. It only appears when the autosave timer
 *      fires for real.
 *   4. Wait for it to return to the "saved" help copy. The save
 *      action has resolved server-side.
 *   5. ONLY THEN navigate away. The polotnoJson row now has the
 *      durable URL persisted.
 *
 * After this helper returns, /dashboard and /projects render the
 * project with `data-project-status="ready"`.
 */
async function makeReady(page: import("@playwright/test").Page, projectId: string): Promise<void> {
  const fixture = path.join(__dirname, "fixtures", "iphone-69.png");
  await page.goto(`/projects/${projectId}/studio`);
  await page.locator('[data-testid="studio-upload-input"]').setInputFiles(fixture);

  // Swap blob → R2 URL completes.
  await expect(
    page.locator('[data-active-panel-screenshot-remote="true"]').first(),
  ).toBeVisible({ timeout: 30_000 });

  // Wait for the dirty/saving cycle to fire. The Persistence InfoCell
  // shows distinct sub-copy per save state — see saveHelp() in
  // components/studio/StudioClient.tsx.
  //   dirty   → "Waiting for the autosave debounce"
  //   saving  → "Writing the panel set to the project"
  //   saved   → "Persisted panel set into the project payload"
  // We anchor on "Persisted panel set" (the SAVED state) AFTER seeing
  // either dirty or saving — proving a real cycle elapsed.
  await expect(
    page.locator('text=/Waiting for the autosave|Writing the panel set/').first(),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.locator('text=/Persisted panel set into the project payload/').first(),
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("Project list surfaces — /dashboard and /projects", () => {
  test("/dashboard: empty project row shows DRAFT (data-project-status='empty'), no fake READY", async ({ page, request }) => {
    const projectId = await createProject(request, "list-dashboard-empty");
    await page.goto("/dashboard");

    const row = page.locator(`[data-project-row="${projectId}"]`);
    await expect(row).toBeVisible();
    // The "empty" status corresponds to no persisted Studio state —
    // a freshly-created project. Badge text is DRAFT but the data
    // attribute distinguishes empty from blocked.
    await expect(row).toHaveAttribute("data-project-status", "empty");
    await expect(row).toHaveAttribute("data-panels-total", "0");
    await expect(row).toHaveAttribute("data-panels-ready", "0");
    await expect(row.locator(".t-mono-xs, .t-eyebrow, span").first()).toBeVisible();
    // The DRAFT badge label is rendered inside the row.
    await expect(row).toContainText("DRAFT");
    // Critically, the row must NOT render the word "READY".
    await expect(row).not.toContainText(/\bREADY\b/);
  });

  test("/projects: empty project card shows DRAFT (data-project-status='empty'), no fake READY", async ({ page, request }) => {
    const projectId = await createProject(request, "list-projects-empty");
    await page.goto("/projects");

    const card = page.locator(`[data-project-card="${projectId}"]`);
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("data-project-status", "empty");
    await expect(card).toHaveAttribute("data-panels-total", "0");
    await expect(card).toHaveAttribute("data-panels-ready", "0");
    await expect(card).toContainText("DRAFT");
    await expect(card).not.toContainText(/\bREADY\b/);
  });

  test("/dashboard: a project with a persisted screenshot flips its row to READY (data-project-status='ready')", async ({ page, request }) => {
    const projectId = await createProject(request, "list-dashboard-ready");
    await makeReady(page, projectId);

    await page.goto("/dashboard");
    const row = page.locator(`[data-project-row="${projectId}"]`);
    await expect(row).toBeVisible();
    await expect(row).toHaveAttribute("data-project-status", "ready");
    await expect(row).toHaveAttribute("data-panels-total", "1");
    await expect(row).toHaveAttribute("data-panels-ready", "1");
    await expect(row).toContainText("READY");
    await expect(row).not.toContainText("DRAFT");
  });

  test("/projects: a project with a persisted screenshot flips its card to READY", async ({ page, request }) => {
    const projectId = await createProject(request, "list-projects-ready");
    await makeReady(page, projectId);

    await page.goto("/projects");
    const card = page.locator(`[data-project-card="${projectId}"]`);
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("data-project-status", "ready");
    await expect(card).toHaveAttribute("data-panels-total", "1");
    await expect(card).toHaveAttribute("data-panels-ready", "1");
    await expect(card).toContainText("READY");
    await expect(card).not.toContainText("DRAFT");
  });

  test("status semantics agree across /dashboard, /projects, and /projects/[id]", async ({ page, request }) => {
    // Cross-surface consistency. The same project must report the
    // same data-project-status on all three pages. If any drifts,
    // someone forgot to use the shared helper.
    const projectId = await createProject(request, "list-cross-surface");
    await makeReady(page, projectId);

    await page.goto("/dashboard");
    const dashStatus = await page
      .locator(`[data-project-row="${projectId}"]`)
      .getAttribute("data-project-status");

    await page.goto("/projects");
    const indexStatus = await page
      .locator(`[data-project-card="${projectId}"]`)
      .getAttribute("data-project-status");

    await page.goto(`/projects/${projectId}`);
    const overviewStatus = await page
      .locator("[data-project-status]")
      .first()
      .getAttribute("data-project-status");

    expect(dashStatus).toBe("ready");
    expect(indexStatus).toBe("ready");
    expect(overviewStatus).toBe("ready");
  });
});
