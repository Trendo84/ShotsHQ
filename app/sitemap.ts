import type { MetadataRoute } from "next";
import { isConstructionMode } from "@/lib/construction";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://shotshq.com";

/**
 * Marketing sitemap. App routes (/dashboard, /projects, /billing, /settings)
 * are auth-gated and intentionally excluded — Search Console doesn't
 * need to index them, and we don't want stray crawlers pinging Clerk.
 *
 * Doc slugs are read from the same in-memory registry the docs page uses.
 * If we move docs to MDX/CMS, this file gets a dynamic loader.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isConstructionMode()) return [];

  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`,           lastModified, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${APP_URL}/pricing`,    lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${APP_URL}/templates`,  lastModified, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${APP_URL}/tools/web-hero`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${APP_URL}/docs`,       lastModified, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${APP_URL}/changelog`,  lastModified, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${APP_URL}/sign-in`,    lastModified, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${APP_URL}/sign-up`,    lastModified, changeFrequency: "yearly",  priority: 0.4 },
  ];

  // Doc pages — slug list mirrors app/(marketing)/docs/[...slug]/page.tsx.
  // Keep in sync if you add new docs.
  const docSlugs = [
    "quickstart",
    "concepts",
    "billing",
    "editor",
    "ai-copy",
    "ai-backdrop",
    "translate",
    "api",
    "status",
    "asc",
    "terms",
    "privacy",
    "security",
    "about",
    "contact",
    "export",
    "device-frames",
  ];

  const docRoutes: MetadataRoute.Sitemap = docSlugs.map((slug) => ({
    url: `${APP_URL}/docs/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...docRoutes];
}
