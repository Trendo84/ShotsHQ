import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Clerk live-key guard.
 *
 * Pre-launch (default): we just WARN if a `pk_test_*` key is shipped to a
 * Vercel production deployment. Builds still pass. The WIP banner is up,
 * the site is openly under construction, and a hard block here would slow
 * iteration to a crawl while the env-var swap and Clerk production-instance
 * DNS dance are still TBD.
 *
 * Launch (strict): set `STRICT_LAUNCH_CHECKS=1` in Vercel → Settings →
 * Environment Variables → Production. With that flag set, this guard
 * upgrades from warning to hard build failure — preventing any future
 * regression where a dev key sneaks back into production.
 *
 * Launch ritual:
 *   1. Configure Clerk production instance (DNS records, OAuth providers).
 *   2. Swap NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_test_* → pk_live_*).
 *   3. Swap CLERK_SECRET_KEY (sk_test_* → sk_live_*).
 *   4. Set STRICT_LAUNCH_CHECKS=1.
 *   5. Remove WipBanner from app/layout.tsx and redeploy.
 */
const usingClerkDevKey =
  process.env.VERCEL_ENV === "production" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_");

if (usingClerkDevKey) {
  const message =
    "[next.config] Clerk DEV key (pk_test_*) detected on a Vercel " +
    "production deployment. The Clerk widget will render 'Development " +
    "mode' to every visitor. Swap to pk_live_* before lifting the WIP banner. " +
    "Set STRICT_LAUNCH_CHECKS=1 to upgrade this warning to a hard build failure.";

  if (process.env.STRICT_LAUNCH_CHECKS === "1") {
    throw new Error(message);
  }
  // eslint-disable-next-line no-console
  console.warn(`\n\x1b[33m⚠ ${message}\x1b[0m\n`);
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
