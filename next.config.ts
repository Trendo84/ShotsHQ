import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
