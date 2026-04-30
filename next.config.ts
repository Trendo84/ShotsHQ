import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Production-build safety check — refuse to build a production deployment
 * with a Clerk dev key (`pk_test_*`). The Clerk widget renders a visible
 * "Development mode" banner on every page when a test key is in use,
 * which leaks staging/dev posture to public visitors and is a known
 * pre-launch gotcha with Vercel env-var swaps.
 *
 * Bypass: set `SKIP_CLERK_LIVE_CHECK=1` for staging or for a deliberate
 * pre-deploy where the live key is intentionally absent.
 *
 * The check only fires on Vercel production environments — local
 * `next build` and Vercel preview deploys are unaffected.
 */
if (
  process.env.VERCEL_ENV === "production" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_") &&
  !process.env.SKIP_CLERK_LIVE_CHECK
) {
  throw new Error(
    "[next.config] Refusing to build production with a Clerk dev key. " +
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY starts with 'pk_test_'. " +
    "Swap to a 'pk_live_*' key in Vercel → Settings → Environment Variables, " +
    "or set SKIP_CLERK_LIVE_CHECK=1 to bypass.",
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
};

export default withSentryConfig(nextConfig, {
  org:     "shotshq",
  project: "shotshq",
  // Upload source maps in CI only — keeps local builds fast.
  silent: true,
  // Tree-shake Sentry logger in production.
  disableLogger: true,
  automaticVercelMonitors: false,
});
