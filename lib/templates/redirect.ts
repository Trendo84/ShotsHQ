/**
 * Auth-aware template redirect URL builder + same-origin redirect
 * validation. Pure logic — no DOM, no React. Tested in
 * `tests/templates/template-redirect.test.ts`.
 *
 * Originating finding: docs/audits/2026-04-30-comet-sonnet-editor.md #1.
 */

/**
 * Where should clicking a template card route the user?
 *
 * - Anonymous → `/sign-up?redirect_url=<encoded /projects/new path>`
 *   (the sign-up page honors `redirect_url` post-completion via
 *   `forceRedirectUrl` on Clerk's <SignUp />.)
 * - Signed-in (any plan) → `/projects/new?template=<slug>` directly.
 *   Tier-gating for Pro templates clicked by Free users is deferred to
 *   `docs/issues/v1.1-template-tier-gating.md`.
 *
 * `isLoaded === false` (Clerk hook still resolving) is treated as
 * anonymous: the SSR'd HTML defaults to the anonymous href so there's
 * no hydration flash for unauthenticated users (the common case on a
 * marketing page).
 */
export function templateHref(opts: {
  slug:       string;
  isLoaded:   boolean;
  isSignedIn: boolean;
}): string {
  const wizardPath = `/projects/new?template=${encodeURIComponent(opts.slug)}`;
  if (!opts.isLoaded || !opts.isSignedIn) {
    return `/sign-up?redirect_url=${encodeURIComponent(wizardPath)}`;
  }
  return wizardPath;
}

/**
 * Validate a `redirect_url` query param against open-redirect attacks.
 * Returns the URL if safe, `null` otherwise. Caller falls back to a
 * default route (e.g. `/dashboard`) on null.
 *
 * Why this is more than "starts with `/`":
 *   - Protocol-relative URLs (`//evil.com/path`) start with `/` and
 *     redirect to other hosts. Classic open-redirect bypass.
 *   - Backslash-prefixed paths (`/\evil.com`) get normalized by some
 *     browsers to forward-slash and become protocol-relative.
 *   - Query-encoded injection (`/?...//evil.com`) doesn't apply to
 *     the redirect target itself but can be embedded in nested params.
 *
 * Implementation: parse with the WHATWG URL constructor against the
 * caller's origin. If the resulting `origin` matches, the path is
 * same-origin. Reject everything else.
 *
 * Origin can be `null` for non-browser callers (server-side
 * validation has no `window.location`); pass it explicitly so this
 * helper stays pure and testable.
 */
export function validateRedirectUrl(
  candidate: string | null | undefined,
  expectedOrigin: string,
): string | null {
  if (!candidate || typeof candidate !== "string") return null;

  // Quick string-level rejects so we never even hand a hostile value to
  // the URL parser. These cover the common bypass shapes:
  //   "//evil.com/x"      → protocol-relative
  //   "/\\evil.com/x"     → backslash that browsers may normalize
  //   "https://evil.com"  → absolute URL
  //   "javascript:alert"  → XSS payload
  //   "data:text/html..." → data URL
  if (
    candidate.startsWith("//") ||
    candidate.startsWith("/\\") ||
    candidate.includes(":") // catches javascript:, data:, http:, https:, mailto:
  ) {
    return null;
  }

  // Must start with a single forward slash — same-origin path only.
  if (!candidate.startsWith("/")) return null;

  // Final defensive check: parse against the caller's origin and
  // verify the resulting origin matches. This catches anything the
  // string checks above might have missed.
  try {
    const parsed = new URL(candidate, expectedOrigin);
    if (parsed.origin !== expectedOrigin) return null;
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return null;
  }
}
