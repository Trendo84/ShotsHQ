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
