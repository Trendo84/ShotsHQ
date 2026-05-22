import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Clerk live-key guard.
 *
 * The audit (`docs/audits/2026-05-22-live-site-app-fix-brief.md` → P0-1)
 * found the live site rendering the Clerk "Development mode" badge and
 * leaking dev-key console warnings to every visitor. The dev keys were
 * still configured in Vercel production after a soft-launch. This guard
 * is the code-side half of the fix; the env swap is the deploy-side half
 * (documented below).
 *
 * Behavior:
 *   - **Default (any production environment, any production-flavored
 *     NODE_ENV / VERCEL_ENV)**: a `pk_test_*` publishable key OR an
 *     `sk_test_*` secret key on a production build is a HARD build
 *     failure. No flag required to opt into the protection. The dev-mode
 *     leak is a credibility-grade incident — better to break the build
 *     than to ship "Development mode" to paying users again.
 *   - **Local dev / preview / non-production**: warn-only. Developers
 *     iterate against `pk_test_*` constantly; the guard never bites
 *     them unless they accidentally label their box as production.
 *   - **Explicit escape hatch**: `ALLOW_CLERK_DEV_KEYS_IN_PROD=1` is the
 *     break-glass override for the deploy ritual itself (when an operator
 *     is intentionally building a staging-flavored prod env that still
 *     runs against dev keys). Use it knowingly; it's logged loudly.
 *
 * Deploy-side fix (still required outside this file):
 *   1. Configure the Clerk production instance (DNS records, OAuth
 *      providers, custom domain).
 *   2. In Vercel → Settings → Environment Variables → Production:
 *        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  →  pk_live_*
 *        CLERK_SECRET_KEY                   →  sk_live_*
 *   3. Redeploy. The Clerk "Development mode" badge disappears and the
 *      browser console no longer warns about dev keys.
 *   4. (Optional) Remove the WipBanner once you're ready to lift the
 *      "Pre-launch build" framing.
 */
// "Production build" here means "a build that will be served to real
// users." That's Vercel's production environment for this project.
// Local `pnpm build` runs for verification have NODE_ENV=production
// too, but they aren't user-facing — gating on VERCEL_ENV avoids
// breaking developer iteration loops.
const IS_PRODUCTION_BUILD = process.env.VERCEL_ENV === "production";

const PUB_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const SEC_KEY = process.env.CLERK_SECRET_KEY                  ?? "";

const usingClerkDevPublishable = PUB_KEY.startsWith("pk_test_");
const usingClerkDevSecret      = SEC_KEY.startsWith("sk_test_");

if (IS_PRODUCTION_BUILD && (usingClerkDevPublishable || usingClerkDevSecret)) {
  const which = [
    usingClerkDevPublishable ? "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_*" : null,
    usingClerkDevSecret      ? "CLERK_SECRET_KEY=sk_test_*"                  : null,
  ].filter(Boolean).join(" + ");

  const message =
    `[next.config] Clerk DEV key detected on a production build (${which}). ` +
    `This causes the Clerk widget to render "Development mode" to every ` +
    `visitor and surfaces dev-key warnings in their browser console. ` +
    `Swap to live keys in Vercel → Settings → Environment Variables → ` +
    `Production. To intentionally build with dev keys against a ` +
    `production-flavored environment, set ALLOW_CLERK_DEV_KEYS_IN_PROD=1 ` +
    `(use knowingly).`;

  if (process.env.ALLOW_CLERK_DEV_KEYS_IN_PROD === "1") {
    // eslint-disable-next-line no-console
    console.warn(`\n\x1b[33m⚠ ${message}\x1b[0m\n`);
  } else {
    throw new Error(message);
  }
}

/**
 * E2E auth-bypass guard — refuse to ship NEXT_PUBLIC_E2E=1 to production.
 *
 * The bypass at proxy.ts + lib/auth/clerk.ts is gated by both a NODE_ENV
 * check AND the env flag, but defense-in-depth: this hard fail makes it
 * impossible to even build a production deployment with the flag set.
 * No carve-out, no bypass — there's no legitimate reason for that flag
 * in production.
 *
 * See: docs/issues/v1.1-playwright-auth-bypass.md
 */
if (
  process.env.VERCEL_ENV === "production" &&
  process.env.NEXT_PUBLIC_E2E === "1"
) {
  throw new Error(
    "[next.config] NEXT_PUBLIC_E2E=1 detected on a Vercel production " +
    "deployment. This flag disables auth via the synthetic E2E user — " +
    "shipping it to production would expose the entire app auth-less. " +
    "Unset it in Vercel → Settings → Environment Variables → Production.",
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "fal.media" },
      { protocol: "https", hostname: "v3.fal.media" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
    /* Allow high-quality variants for hero/backdrop assets — default 75
       caused banding in the AI-generated gradient under mix-blend-screen. */
    qualities: [75, 90, 95, 100],
    /* AVIF first — dithers gradients better than WebP, smaller files. */
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  serverExternalPackages: ["sharp", "@aws-sdk/client-s3"],

  /* HTTP security headers — Next does not add these by default. CSP is
     deliberately permissive on script-src for now (Clerk + PostHog need
     'unsafe-inline' + 'unsafe-eval'); tighten with hashes/nonces post-launch. */
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options",        value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      {
        key:   "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://us.i.posthog.com https://us-assets.i.posthog.com",
          "connect-src 'self' https://clerk.com https://*.clerk.accounts.dev https://api.clerk.com https://us.i.posthog.com https://us-assets.i.posthog.com https://*.r2.cloudflarestorage.com https://*.r2.dev https://api.openai.com https://fal.run https://*.ingest.sentry.io",
          "img-src 'self' data: blob: https:",
          "media-src 'self' blob:",
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self' https://fonts.gstatic.com data:",
          "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self' https://*.clerk.accounts.dev",
          "worker-src 'self' blob:",
        ].join("; "),
      },
    ];
    return [{ source: "/(.*)", headers: securityHeaders }];
  },

  /**
   * Top-level legal / contact aliases.
   *
   * Audit P1-5: `/privacy`, `/security`, `/terms`, `/contact` 404'd
   * because the canonical content lives under `/docs/<slug>`. These
   * short paths are what users (and external link audits) reach for
   * by habit, so they should resolve. We 308-redirect to the canonical
   * doc page rather than duplicating content — keeps a single source
   * of truth in `app/(marketing)/docs/[...slug]/page.tsx`.
   *
   * 308 (permanent) preserves the request method and tells search
   * engines to remember the canonical location.
   */
  async redirects() {
    return [
      { source: "/privacy",  destination: "/docs/privacy",  permanent: true },
      { source: "/terms",    destination: "/docs/terms",    permanent: true },
      { source: "/security", destination: "/docs/security", permanent: true },
      { source: "/contact",  destination: "/docs/contact",  permanent: true },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org:     "shotshq",
  project: "shotshq",
  // Remote Vercel builds started failing inside Sentry's source-map frame
  // filtering step with `ERR_INVALID_ARG_TYPE: path must be string` even
  // though local `next build` succeeds. Until that upstream/toolchain issue is
  // resolved, disable source-map processing/upload so production deploys stay
  // reliable. Runtime error capture still works; only source-map symbolication
  // is reduced.
  sourcemaps: {
    disable: true,
  },
  silent: true,
  // Tree-shake Sentry logger in production.
  disableLogger: true,
  automaticVercelMonitors: false,
});
