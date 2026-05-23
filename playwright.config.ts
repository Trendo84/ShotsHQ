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
  // One retry locally smooths over rare autosave-timing flakes from
  // the studio specs (cycle #6 audit): under heavy parallel R2 +
  // dev-server load, the 900ms autosave debounce occasionally races
  // with the test's wait assertion. CI keeps the stricter 2 retries.
  retries: process.env.CI ? 2 : 1,
  // Cap parallel workers to 2 locally: the studio upload + autosave
  // path hits the dev server hard (R2 PUT + Server Action round-trip
  // + Next dev recompiles). More than 2 workers makes the dev
  // server choke and tests flake out wholesale.
  workers: process.env.CI ? 1 : 2,
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
