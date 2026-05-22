import { describe, it, expect } from "vitest";
import { resolveBuildInfo } from "@/lib/observability/version";

/**
 * Contract test for the /api/health version-resolution chain.
 *
 * Audit P0-3: production used to report `version: "dev"` because the
 * only resolution was a missing env var. The fallback chain now goes:
 *   NEXT_PUBLIC_APP_VERSION
 *   → VERCEL_GIT_COMMIT_SHA (7-char short)
 *   → GITHUB_SHA           (7-char short)
 *   → SOURCE_COMMIT        (7-char short)
 *   → npm_package_version
 *   → "unknown"
 *
 * Tests pass an explicit `env` snapshot to `resolveBuildInfo` so we
 * don't have to mutate process.env between specs.
 */
describe("resolveBuildInfo()", () => {
  it("prefers NEXT_PUBLIC_APP_VERSION verbatim", () => {
    const b = resolveBuildInfo({
      NEXT_PUBLIC_APP_VERSION:    "2026.05.22+hotfix",
      VERCEL_GIT_COMMIT_SHA:      "0123456789abcdef0123456789abcdef01234567",
      npm_package_version:        "0.1.0",
    });
    expect(b).toEqual({ version: "2026.05.22+hotfix", source: "app_version" });
  });

  it("falls back to VERCEL_GIT_COMMIT_SHA (truncated to 7 chars)", () => {
    const b = resolveBuildInfo({
      VERCEL_GIT_COMMIT_SHA: "0123456789abcdef0123456789abcdef01234567",
      npm_package_version:   "0.1.0",
    });
    expect(b).toEqual({ version: "0123456", source: "vercel_sha" });
  });

  it("falls back to GITHUB_SHA (truncated to 7 chars)", () => {
    const b = resolveBuildInfo({
      GITHUB_SHA:          "deadbeefcafebabe1234567890abcdef00000000",
      npm_package_version: "0.1.0",
    });
    expect(b).toEqual({ version: "deadbee", source: "github_sha" });
  });

  it("falls back to SOURCE_COMMIT (truncated to 7 chars)", () => {
    const b = resolveBuildInfo({
      SOURCE_COMMIT: "abcdef1234567890abcdef1234567890abcdef12",
    });
    expect(b).toEqual({ version: "abcdef1", source: "source_commit" });
  });

  it("falls back to npm_package_version when no SHA is set", () => {
    const b = resolveBuildInfo({ npm_package_version: "0.1.0" });
    expect(b).toEqual({ version: "0.1.0", source: "package_version" });
  });

  it("returns 'unknown' (NOT 'dev') when nothing is set", () => {
    const b = resolveBuildInfo({});
    expect(b).toEqual({ version: "unknown", source: "unknown" });
  });

  it("treats empty / whitespace-only env values as unset", () => {
    const b = resolveBuildInfo({
      NEXT_PUBLIC_APP_VERSION: "   ",
      VERCEL_GIT_COMMIT_SHA:   "",
      npm_package_version:     "0.1.0",
    });
    expect(b.source).toBe("package_version");
    expect(b.version).toBe("0.1.0");
  });

  it("trims surrounding whitespace from the chosen identifier", () => {
    const b = resolveBuildInfo({
      NEXT_PUBLIC_APP_VERSION: "  2026.05.22  ",
    });
    expect(b.version).toBe("2026.05.22");
    expect(b.source).toBe("app_version");
  });
});
