/**
 * Build/version identifier resolution.
 *
 * The /api/health endpoint used to return `version: "dev"` in
 * production because the only source was `NEXT_PUBLIC_APP_VERSION`,
 * which nobody sets. That made the endpoint useless for tooling and
 * incident response — every deploy looked identical from the outside.
 *
 * This helper resolves the most-specific identifier available, with
 * a documented fallback chain so the response is always meaningful:
 *
 *   1. `NEXT_PUBLIC_APP_VERSION`      — operator-supplied (highest signal)
 *   2. `VERCEL_GIT_COMMIT_SHA`        — Vercel auto-sets this; 40-char SHA
 *   3. `GITHUB_SHA`                   — GitHub Actions auto-sets
 *   4. `SOURCE_COMMIT`                — Docker/Heroku-style
 *   5. `npm_package_version`          — `package.json` version (pre-launch fallback)
 *   6. `"unknown"`                    — never `"dev"`; "dev" is a lie in prod
 *
 * Returned SHA values are truncated to 7 chars (the standard short
 * form) for log readability while remaining unique enough for any
 * realistic project.
 */

export type BuildInfo = {
  /** The chosen version identifier — guaranteed non-empty. */
  version: string;
  /** Which fallback supplied it (useful for debugging). */
  source:
    | "app_version"
    | "vercel_sha"
    | "github_sha"
    | "source_commit"
    | "package_version"
    | "unknown";
};

function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

/**
 * Loose env type — `NodeJS.ProcessEnv` requires `NODE_ENV` under
 * strict TS, which is overkill for a helper that only reads optional
 * keys. Accept any env-shaped dict so callers (and tests) don't have
 * to pad with unused keys.
 */
type LooseEnv = Record<string, string | undefined>;

export function resolveBuildInfo(env: LooseEnv = process.env as unknown as LooseEnv): BuildInfo {
  const explicit = env.NEXT_PUBLIC_APP_VERSION?.trim();
  if (explicit) return { version: explicit, source: "app_version" };

  const vercelSha = env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (vercelSha) return { version: shortSha(vercelSha), source: "vercel_sha" };

  const ghSha = env.GITHUB_SHA?.trim();
  if (ghSha) return { version: shortSha(ghSha), source: "github_sha" };

  const sourceCommit = env.SOURCE_COMMIT?.trim();
  if (sourceCommit) return { version: shortSha(sourceCommit), source: "source_commit" };

  const pkgVersion = env.npm_package_version?.trim();
  if (pkgVersion) return { version: pkgVersion, source: "package_version" };

  return { version: "unknown", source: "unknown" };
}
