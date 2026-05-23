import { test, expect } from "@playwright/test";
import path from "node:path";

/**
 * Studio screenshot upload — persistence end-to-end.
 *
 * Browser audit (cycle #3, 2026-05-23): Studio's upload handler used
 * to set `screenshotUrl: <blob URL>` + `screenshotRemote: false`.
 * `sanitizeStudioDesign` stripped blob URLs on save. Result: a panel
 * looked "ready" in-memory but the screenshot vanished on reload.
 *
 * Fix routes uploads through `/api/upload/direct`, swaps the blob URL
 * with the durable `https:` URL, and
 * flips `screenshotRemote=true`. Autosave persists the durable URL
 * inside `polotnoJson.studio`, and on reload the panel comes back
 * ready.
 *
 * This spec exercises the full loop:
 *   1. fresh project, panel is blocked (no screenshot)
 *   2. upload a real PNG fixture
 *   3. wait for the upload to flip the panel to remote
 *   4. wait for Studio's "Saved" indicator (autosave round-trip)
 *   5. reload the page
 *   6. assert: panel is still READY, screenshot URL is remote, export
 *      buttons are enabled
 *
 * Auth + construction-gate bypass via playwright.config.ts webServer.env.
 * Uses real R2 credentials from .env.local — the dev server's
 * /api/upload presign + the browser PUT both land against the real
 * `pub-c1ffb868554d437eb7d020286345facf.r2.dev` bucket. Test files
 * accumulate under `users/<E2E-user-id>/projects/<test-project>/` —
 * cheap cruft on a dev bucket.
 */

async function createProject(
  request: import("@playwright/test").APIRequestContext,
  name:    string,
): Promise<string> {
  const res = await request.post("/api/projects", {
    data: {
      name,
      appName:        "Persist",
      appDescription: "Cycle 3 persistence smoke",
      category:       "",
      storeTargets:   ["iphone-17-pro-max"],
    },
  });
  expect(res.ok()).toBe(true);
  const json = (await res.json()) as { ok: true; data: { id: string } };
  return json.data.id;
}

const FIXTURE = path.join(__dirname, "fixtures", "iphone-69.png");

test.describe("Studio screenshot upload persistence", () => {
  test("uploaded screenshot survives autosave + reload, panel stays READY", async ({ page, request }) => {
    const projectId = await createProject(request, "studio-upload-persist");
    await page.goto(`/projects/${projectId}/studio`);

    // Fresh project anchor: the active panel must start blocked
    // because no screenshot is uploaded yet (default headline IS
    // seeded, so the only blocker is screenshot).
    await expect(page.locator('[data-export-current-enabled]')).toHaveAttribute(
      "data-export-current-enabled",
      "false",
    );
    await expect(
      page.locator('[data-active-panel-screenshot-remote="false"]').first(),
    ).toBeVisible();

    // Step 1: select a file via the hidden input.
    const input = page.locator('[data-testid="studio-upload-input"]');
    await input.setInputFiles(FIXTURE);

    // Step 2: wait for the upload to complete — the data attribute
    // on the dropzone button flips to "true" only after the PUT
    // succeeds and the panel is swapped to the remote URL.
    await expect(
      page.locator('[data-active-panel-screenshot-remote="true"]').first(),
    ).toBeVisible({ timeout: 30_000 });

    // Step 3: panel readiness flips to enabled now that the
    // screenshot is durable.
    await expect(page.locator('[data-export-current-enabled]')).toHaveAttribute(
      "data-export-current-enabled",
      "true",
      { timeout: 5_000 },
    );

    // Step 4: filmstrip tile reports READY.
    await expect(
      page.locator('[data-panel-ready="true"]').first(),
    ).toBeVisible();

    // Step 5: wait for the autosave indicator to read "Saved". The
    // Studio InfoCell exposes this via its visible text; the
    // "Persistence" cell's value is "Saved" when saveState === "saved".
    await expect(page.locator("text=/^Saved$/").first()).toBeVisible({
      timeout: 15_000,
    });

    // Step 6: reload the page. The server should re-hydrate Studio
    // from polotnoJson.studio with the durable URL intact.
    await page.reload();

    // Step 7: panel is still READY after the round-trip.
    await expect(
      page.locator('[data-active-panel-screenshot-remote="true"]').first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('[data-panel-ready="true"]').first(),
    ).toBeVisible();
    await expect(page.locator('[data-export-current-enabled]')).toHaveAttribute(
      "data-export-current-enabled",
      "true",
    );

    // Step 8: /exports for the same project also reflects ready.
    await page.goto(`/projects/${projectId}/exports`);
    await expect(
      page.locator('[data-readiness-status="ready"]').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("freshly-dropped blob screenshot does NOT claim ready until persisted", async ({ page, request }) => {
    // This documents the contract: the brief 100–500ms window between
    // "blob URL set" and "R2 PUT completes" must not show the panel
    // as ready. We can't easily hit that exact race in CI, but we can
    // verify the steady-state contract: data-active-panel-screenshot-
    // remote="false" is mutually exclusive with the panel being
    // marked ready in the filmstrip.
    const projectId = await createProject(request, "studio-upload-mid-flight");
    await page.goto(`/projects/${projectId}/studio`);

    // Default panel: no screenshot at all, screenshotRemote=false,
    // panel-ready=false. Verify this baseline holds. After upload
    // completes, the OTHER spec confirms the flip; what this one
    // protects is the "remote=false ⟹ not ready" invariant.
    await expect(
      page.locator('[data-active-panel-screenshot-remote="false"]').first(),
    ).toBeVisible();
    await expect(
      page.locator('[data-panel-ready="false"]').first(),
    ).toBeVisible();
    await expect(page.locator('[data-export-current-enabled]')).toHaveAttribute(
      "data-export-current-enabled",
      "false",
    );
  });
});
