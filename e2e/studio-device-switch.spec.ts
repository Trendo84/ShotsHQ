import { test, expect } from "@playwright/test";

/**
 * Studio device-class switch — regression coverage.
 *
 * Browser audit (2026-05-23) found that clicking iPhone 6.7" or iPad 13"
 * in Studio's Device class panel left iPhone 6.9" visually selected.
 * Preview header + filmstrip stayed on iPhone 6.9. This spec drives the
 * happy path end-to-end (create project → open Studio → click iPad →
 * preview must reflect iPad → reload → still iPad).
 *
 * Auth bypass via NEXT_PUBLIC_E2E=1 (proxy.ts + lib/auth/clerk.ts).
 * Construction-mode bypass via SHOTSHQ_CONSTRUCTION_MODE=0
 * (playwright.config.ts webServer.env).
 */

async function createProject(request: import("@playwright/test").APIRequestContext, name: string): Promise<string> {
  const res = await request.post("/api/projects", {
    data: {
      name,
      appName:        "Switch",
      appDescription: "",
      category:       "",
      storeTargets:   ["iphone-17-pro-max", "ipad-pro-13-m4"],
    },
  });
  expect(res.ok()).toBe(true);
  const json = (await res.json()) as { ok: true; data: { id: string } };
  return json.data.id;
}

test.describe("Studio device-class switch", () => {
  test("clicking iPad 13″ updates selected styling + preview header", async ({ page, request }) => {
    const projectId = await createProject(request, "studio-switch-e2e");
    await page.goto(`/projects/${projectId}/studio`);

    // Anchor on the new role/data attributes — these are the stable
    // contract the UI exposes to a11y tools + tests.
    const iphone69 = page.locator('[data-device-id="iphone_69"]');
    const ipad13   = page.locator('[data-device-id="ipad_13"]');
    await expect(iphone69).toBeVisible();
    await expect(ipad13).toBeVisible();

    // Default = iPhone 6.9 selected.
    await expect(iphone69).toHaveAttribute("data-active", "true");
    await expect(ipad13).toHaveAttribute("data-active", "false");

    // Preview header default state.
    const previewHeader = page.locator("text=/exact export\\s+\\d+×\\d+/").first();
    await expect(previewHeader).toContainText(/1290×2796/);
    await expect(previewHeader).toContainText(/iPhone 6\.9/);

    // Click iPad.
    await ipad13.click();

    // Selected styling moves to iPad.
    await expect(ipad13).toHaveAttribute("data-active", "true", { timeout: 5_000 });
    await expect(iphone69).toHaveAttribute("data-active", "false");

    // Preview header updates to iPad's dimensions + label.
    await expect(previewHeader).toContainText(/2064×2752/, { timeout: 5_000 });
    await expect(previewHeader).toContainText(/iPad 13/);

    // aria-checked / aria-pressed reflect the new selection.
    await expect(ipad13).toHaveAttribute("aria-checked", "true");
    await expect(ipad13).toHaveAttribute("aria-pressed", "true");
    await expect(iphone69).toHaveAttribute("aria-checked", "false");
  });

  test("filmstrip metadata + preview reflect iPad after switch", async ({ page, request }) => {
    const projectId = await createProject(request, "studio-filmstrip-e2e");
    await page.goto(`/projects/${projectId}/studio`);

    const ipad13 = page.locator('[data-device-id="ipad_13"]');
    await ipad13.click();
    await expect(ipad13).toHaveAttribute("data-active", "true", { timeout: 5_000 });

    // Filmstrip card text contains the device short label.
    await expect(page.locator("text=iPad 13").first()).toBeVisible();
  });

  test("device-class selection persists across page reload (autosave)", async ({ page, request }) => {
    const projectId = await createProject(request, "studio-persist-e2e");
    await page.goto(`/projects/${projectId}/studio`);

    const ipad13   = page.locator('[data-device-id="ipad_13"]');
    const iphone69 = page.locator('[data-device-id="iphone_69"]');

    // Switch to iPad.
    await ipad13.click();
    await expect(ipad13).toHaveAttribute("data-active", "true", { timeout: 5_000 });

    // Wait past the 900ms autosave debounce + give the server action
    // time to land. We watch for the saved-state UI indicator
    // ("Saved" on the persistence info cell) as a reliable readout.
    await expect(page.locator("text=/Saved$/").first()).toBeVisible({ timeout: 10_000 });

    // Reload the page — the server should re-hydrate Studio from the
    // persisted polotnoJson.studio set with iPad as the active device.
    await page.reload();

    // Selection persists after reload.
    await expect(page.locator('[data-device-id="ipad_13"]')).toHaveAttribute("data-active", "true", { timeout: 10_000 });
    await expect(page.locator('[data-device-id="iphone_69"]')).toHaveAttribute("data-active", "false");
    // Preview header still reads iPad dims.
    await expect(page.locator("text=/exact export\\s+\\d+×\\d+/").first()).toContainText(/2064×2752/);
  });
});
