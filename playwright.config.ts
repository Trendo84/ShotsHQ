import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — minimal scaffold.
 *
 * v1: only the wizard navigation spec runs. Auth bypass for `(app)/*`
 * routes requires more infrastructure (dummy user record, getBalance
 * stub, Clerk-free middleware path) than scoped for this pass — the
 * spec at `e2e/wizard.spec.ts` is currently `.skip()`-marked behind a
 * note. The vitest suite covers all canvas + dispatch logic.
 *
 * v1.1: extend with editor save round-trip, AI dispatch happy path,
 * Stripe checkout smoke. See TODO at the bottom of `e2e/wizard.spec.ts`.
 *
 * Run: `npx playwright install` once, then `pnpm test:e2e`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command: "pnpm dev",
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          NEXT_PUBLIC_E2E:           "1",
          // The marketing "Under Construction" gate (lib/construction.ts)
          // is on by default. E2E tests bypass it via the same explicit
          // opt-out env var operators flip when previewing internally —
          // we don't carry the construction cookie around.
          SHOTSHQ_CONSTRUCTION_MODE: "0",
        },
      },
});
