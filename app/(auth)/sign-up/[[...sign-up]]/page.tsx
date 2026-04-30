"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { validateRedirectUrl } from "@/lib/templates/redirect";

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const DEFAULT_REDIRECT = "/dashboard";

/**
 * Sign-up entry. Honors a `?redirect_url=` query param so callers (e.g.
 * the templates gallery) can hand off the post-signup destination —
 * see lib/templates/redirect.ts and docs/audits/2026-04-30-comet-sonnet-editor.md
 * finding #1.
 *
 * SECURITY: the redirect param is validated against same-origin via
 * `validateRedirectUrl`. The validator rejects:
 *   - protocol-relative URLs (`//evil.com/path`) — classic open-redirect
 *   - backslash variants (`/\evil.com`) that browsers may normalize
 *   - any string containing `:` (catches `javascript:`, `data:`, etc.)
 *   - anything that doesn't start with a single `/`
 * Plus a final defensive `new URL(...).origin === expected.origin` check.
 *
 * Falls back to `/dashboard` if the param is missing or invalid. NEVER
 * pass an unvalidated string to `forceRedirectUrl` — that's the whole
 * point of the validator.
 */
export default function SignUpPage() {
  const searchParams = useSearchParams();
  const candidate = searchParams?.get("redirect_url") ?? null;
  const expectedOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  // On the server (during initial render before hydration), `window` is
  // undefined and `expectedOrigin` is empty — treat as invalid and fall
  // back. The client re-evaluates on hydration and the validator runs
  // properly. Worst case: a flicker between fallback and validated URL,
  // which is invisible because Clerk's <SignUp /> only reads the prop
  // after the user submits.
  const safeRedirect = expectedOrigin
    ? validateRedirectUrl(candidate, expectedOrigin) ?? DEFAULT_REDIRECT
    : DEFAULT_REDIRECT;

  return (
    <div className="w-full max-w-md">
      <div className="t-mono-xs text-[var(--accent)] mb-2">[ AUTH / SIGN-UP ]</div>
      <h2 className="t-display text-[42px] leading-[0.9] mb-2">CREATE<br />OPERATOR</h2>
      <p className="t-mono-xs text-[var(--fg-mute)] mb-6">
        FREE FOREVER · NO CARD REQUIRED · WATERMARK ON FREE EXPORTS
      </p>
      <div className="border border-[var(--line-strong)] bg-[var(--bg)] p-1 shadow-[6px_6px_0_var(--accent)]">
        {HAS_CLERK ? (
          <SignUp
            forceRedirectUrl={safeRedirect}
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                footerAction: "t-mono-xs",
              },
            }}
          />
        ) : (
          <div className="p-6 space-y-4">
            <div className="t-mono-xs text-[var(--accent)]">[ AUTH / NOT CONFIGURED ]</div>
            <p className="t-mono-sm text-[var(--fg-dim)] leading-relaxed">
              CLERK PUBLISHABLE KEY NOT FOUND. SET <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
              IN <code>.env.local</code> TO ENABLE SIGN-UP.
            </p>
            <Link href={safeRedirect} className="btn btn-accent w-full">
              BROWSE APP IN PREVIEW MODE &gt;&gt;
            </Link>
            <Link href="/" className="t-mono-xs text-[var(--fg-mute)] hover:text-[var(--accent)] block">← BACK TO MARKETING</Link>
          </div>
        )}
      </div>
    </div>
  );
}
