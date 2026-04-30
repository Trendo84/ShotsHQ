import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Minimal vitest config — node environment only (the canvas tests are
 * pure logic, no DOM). Path alias `@/*` mirrors tsconfig.
 *
 * Excludes Playwright e2e specs in `e2e/` and any compiled `.next`
 * artifacts so `pnpm test` only picks up the vitest tree.
 */
export default defineConfig({
  test: {
    environment: "node",
    include:     ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude:     ["node_modules", ".next", "e2e/**", "playwright-report/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
