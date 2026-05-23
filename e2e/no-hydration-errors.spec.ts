import { test, expect } from "@playwright/test";

/**
 * No hydration errors across authenticated routes.
 *
 * Cycle #6 (2026-05-23) found `/dashboard`, `/projects/new`,
 * `/projects/[id]/studio`, `/projects`, `/billing`, and `/settings`
 * all emitting `Hydration failed because the server rendered HTML
 * didn't match the client` — stack pointed at `Topbar.tsx` around
 * `<UserButton />` / `ClerkHostRenderer`.
 *
 * Fix wrapped the Clerk widget in a mount-gate (stable placeholder
 * during SSR + first client render, swap to the real widget after
 * useEffect fires). This spec is the regression net: visit each
 * affected route + collect every browser console message; fail if
 * any message text mentions "hydration", "hydrate", or matches the
 * React error #418/#421/#423 codes (React's minified production
 * hydration errors).
 *
 * The spec also fails on `pageerror` events — any uncaught
 * exception during mount counts as a regression.
 */

const HYDRATION_ERROR_RE =
  /hydrat|hydrated text didn't match|server rendered HTML didn't match|Minified React error #(418|421|423|425)/i;

const ROUTES_THAT_USE_TOPBAR: { path: (id: string) => string; needsProject?: boolean; label: string }[] = [
  { label: "/dashboard",                path: () => "/dashboard" },
  { label: "/projects",                 path: () => "/projects" },
  { label: "/projects/new",             path: () => "/projects/new" },
  { label: "/projects/[id]",            path: (id) => `/projects/${id}`,           needsProject: true },
  { label: "/projects/[id]/studio",     path: (id) => `/projects/${id}/studio`,    needsProject: true },
  { label: "/projects/[id]/exports",    path: (id) => `/projects/${id}/exports`,   needsProject: true },
  { label: "/billing",                  path: () => "/billing" },
  { label: "/settings",                 path: () => "/settings" },
];

async function createProject(
  request: import("@playwright/test").APIRequestContext,
): Promise<string> {
  const res = await request.post("/api/projects", {
    data: {
      name:           "hydration-smoke",
      appName:        "Hydration",
      appDescription: "Cycle 6 hydration smoke",
      category:       "",
      storeTargets:   ["iphone-16-pro-max"],
    },
  });
  expect(res.ok()).toBe(true);
  return ((await res.json()) as { data: { id: string } }).data.id;
}

test.describe("Hydration smoke — authenticated routes with Topbar", () => {
  test("no hydration errors or pageerror events on any Topbar-using route", async ({ page, request }) => {
    // Create one project so the project-scoped routes have an ID
    // to navigate to.
    const projectId = await createProject(request);

    // Collect every console error / page error across every
    // navigation in this test. Per-route we'll also report which
    // route each message came from.
    type Issue = { route: string; type: "console" | "pageerror"; text: string };
    const issues: Issue[] = [];
    let currentRouteLabel = "(setup)";

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (HYDRATION_ERROR_RE.test(text)) {
          issues.push({ route: currentRouteLabel, type: "console", text });
        }
      }
    });
    page.on("pageerror", (err) => {
      const text = err.message ?? String(err);
      if (HYDRATION_ERROR_RE.test(text)) {
        issues.push({ route: currentRouteLabel, type: "pageerror", text });
      }
    });

    for (const route of ROUTES_THAT_USE_TOPBAR) {
      currentRouteLabel = route.label;
      const url = route.path(projectId);
      await page.goto(url, { waitUntil: "domcontentloaded" });

      // Give React a chance to hydrate + Clerk's UserButton (if
      // configured) a chance to mount. Hydration errors fire during
      // hydration which happens shortly after first paint; we wait
      // for the Topbar's user-slot to fully resolve to its
      // post-mount state (data-userbutton-slot is set to "clerk" or
      // "no-clerk", never "placeholder", once the mount-gate has
      // run).
      //
      // Use toBeAttached, not toBeVisible: Clerk's <UserButton />
      // briefly renders an empty container before its avatar lands,
      // and Playwright considers a div with no visible children
      // "hidden". Attachment is the right contract here — we care
      // that the gate flipped, not that pixels arrived.
      const slot = page.locator('[data-userbutton-slot]').first();
      await expect(slot).toBeAttached({ timeout: 5_000 });
      await expect(slot).not.toHaveAttribute("data-userbutton-slot", "placeholder", { timeout: 5_000 });

      // Idle a beat so any late console errors surface before we
      // move on. Hydration errors are usually flushed during the
      // initial render but Clerk's widget can re-render a few
      // times during its session-load lifecycle.
      await page.waitForTimeout(500);
    }

    if (issues.length > 0) {
      const formatted = issues
        .map((i) => `[${i.route}] ${i.type}: ${i.text.split("\n")[0]}`)
        .join("\n");
      throw new Error(`Hydration errors detected across Topbar routes:\n${formatted}`);
    }
  });
});
