import type { MetadataRoute } from "next";
import { isConstructionMode } from "@/lib/construction";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://shotshq.com";

export default function robots(): MetadataRoute.Robots {
  if (isConstructionMode()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      host: APP_URL,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // App, billing, settings are auth-gated; explicitly exclude so
        // crawlers don't waste budget on the redirect.
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/projects",
          "/projects/",
          "/billing",
          "/billing/",
          // Stripe redirect lands here with a `?cs=cs_live_…` session ID
          // in the URL — explicitly disallow so a shared link can't leak
          // the checkout token to crawlers / referrer logs.
          "/billing/success",
          "/settings",
          "/settings/",
          "/api/",
        ],
      },
      // Block malicious / aggressive scrapers. Add rows as we identify them.
      { userAgent: "GPTBot",         disallow: "/" },
      { userAgent: "Google-Extended",disallow: "/" },
      { userAgent: "CCBot",          disallow: "/" },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
