/**
 * Surface catalog — every output channel ShotsHQ can render to from a
 * single project. The render pipeline takes a Polotno scene + a list
 * of selected SurfaceIds and fans out to dimension-specific exports.
 *
 * Each surface declares:
 *   - exact pixel dimensions Apple / Twitter / GitHub / etc. require
 *   - aspect ratio for in-app preview tiles
 *   - whether it's covered by the user's plan (gated downstream)
 *   - what changes when re-flowing the scene (margins, text scale)
 */

export type SurfaceCategory =
  | "appstore"     // iOS App Store screenshots
  | "web"          // marketing/website
  | "social"       // OG, Twitter, Discord cards
  | "community"    // Product Hunt, GitHub
  | "press";       // press kit ZIP

export type SurfacePlan = "free" | "indie" | "studio";

export type SurfaceVariant = {
  id: string;
  name: string;
  width: number;
  height: number;
  required?: boolean;
};

export type Surface = {
  id: string;
  name: string;
  category: SurfaceCategory;
  description: string;
  /** Plan tier required to actually render this surface. */
  minPlan: SurfacePlan;
  /** Aspect ratio for in-app preview tiles (canonical, picks first variant). */
  previewAspect: string;
  /** Pixel dimensions per output. */
  variants: SurfaceVariant[];
  /** Status flag for our own roadmap. */
  status: "live" | "beta" | "soon";
  /** Tagline shown next to the surface name. */
  tagline: string;
  /** Why a user would pick this. */
  rationale: string;
};

export const SURFACES: Surface[] = [
  /* ─────────────  App Store screenshots — the core product  ───────────── */
  {
    id: "ios-appstore",
    name: "App Store screenshots",
    category: "appstore",
    description: "Apple-required screenshot dimensions, per device family.",
    minPlan: "free",
    previewAspect: "9 / 19.5",
    variants: [
      { id: "iphone-69",   name: "iPhone 6.9″",  width: 1290, height: 2796, required: true },
      { id: "iphone-67",   name: "iPhone 6.7″",  width: 1320, height: 2868 },
      { id: "ipad-13",     name: "iPad 13″",     width: 2064, height: 2752, required: true },
    ],
    status: "live",
    tagline: "The reason you're here.",
    rationale: "All Apple-required dimensions, locale-aware, with optional device frames.",
  },

  /* ─────────────  Website hero (the next big SKU)  ───────────── */
  {
    id: "web-hero-desktop",
    name: "Website hero — desktop",
    category: "web",
    description: "16:9 hero image for your marketing site or landing page.",
    minPlan: "indie",
    previewAspect: "16 / 9",
    variants: [
      { id: "1920x1080", name: "Standard",       width: 1920, height: 1080 },
      { id: "2880x1620", name: "Retina",         width: 2880, height: 1620 },
      { id: "3840x2160", name: "4K",             width: 3840, height: 2160 },
    ],
    status: "beta",
    tagline: "Drop-in for Framer / Webflow.",
    rationale: "Same source screens, wide-crop layout that keeps the hero phone visible.",
  },
  {
    id: "web-hero-mobile",
    name: "Website hero — mobile",
    category: "web",
    description: "Tall hero crop for mobile viewports.",
    minPlan: "indie",
    previewAspect: "750 / 1334",
    variants: [
      { id: "750x1334",  name: "Mobile",         width: 750,  height: 1334 },
      { id: "1080x1920", name: "Mobile retina",  width: 1080, height: 1920 },
    ],
    status: "beta",
    tagline: "Tight crop for phone visitors.",
    rationale: "Re-flowed from the desktop hero — headline scales, phone hero is preserved.",
  },

  /* ─────────────  Social cards  ───────────── */
  {
    id: "og-twitter",
    name: "OG / Twitter card",
    category: "social",
    description: "1200×630 social share card for every page.",
    minPlan: "indie",
    previewAspect: "1200 / 630",
    variants: [
      { id: "1200x630", name: "Standard",   width: 1200, height: 630 },
      { id: "1600x840", name: "Retina",     width: 1600, height: 840 },
    ],
    status: "beta",
    tagline: "Auto-generated per page, locale-aware.",
    rationale: "Refreshes when copy changes. Plug straight into Next.js generateMetadata.",
  },
  {
    id: "discord-share",
    name: "Discord embed",
    category: "social",
    description: "Compact embed-friendly square.",
    minPlan: "indie",
    previewAspect: "1 / 1",
    variants: [
      { id: "1080x1080", name: "Square",     width: 1080, height: 1080 },
    ],
    status: "soon",
    tagline: "Drops cleanly into your server.",
    rationale: "Tight-crop variant of the OG card optimised for Discord previews.",
  },

  /* ─────────────  Community  ───────────── */
  {
    id: "product-hunt",
    name: "Product Hunt gallery",
    category: "community",
    description: "Eight-tile gallery formatted for your hunt day.",
    minPlan: "indie",
    previewAspect: "127 / 76",
    variants: [
      { id: "1270x760",  name: "Tile (×8)",      width: 1270, height: 760 },
      { id: "240x240",   name: "Logo",           width: 240,  height: 240 },
    ],
    status: "soon",
    tagline: "Hunt-day ready.",
    rationale: "Exact dimensions PH wants. We render the gallery + thumbnail + topic icon.",
  },
  {
    id: "github-social",
    name: "GitHub repo banner",
    category: "community",
    description: "Repo Open Graph banner + README hero.",
    minPlan: "indie",
    previewAspect: "2 / 1",
    variants: [
      { id: "1280x640",  name: "Repo OG",        width: 1280, height: 640 },
      { id: "2048x1024", name: "README hero",    width: 2048, height: 1024 },
    ],
    status: "soon",
    tagline: "Repo OG + README hero, one render.",
    rationale: "If your app is open source, this drops straight into both surfaces.",
  },

  /* ─────────────  Press kit  ───────────── */
  {
    id: "press-kit",
    name: "Press kit ZIP",
    category: "press",
    description: "Every variant above + brand assets, bundled.",
    minPlan: "studio",
    previewAspect: "4 / 3",
    variants: [
      { id: "zip", name: "ZIP archive", width: 0, height: 0 },
    ],
    status: "soon",
    tagline: "All surfaces · brand kit · one URL.",
    rationale: "Logos, palette, type, every dimension above. One link to share with press.",
  },
];

export const SURFACES_BY_ID: Record<string, Surface> = Object.fromEntries(
  SURFACES.map((s) => [s.id, s]),
);

/** Group for the picker UI. */
export const SURFACE_CATEGORIES: Array<{ id: SurfaceCategory; label: string }> = [
  { id: "appstore",  label: "App Store" },
  { id: "web",       label: "Website" },
  { id: "social",    label: "Social cards" },
  { id: "community", label: "Community" },
  { id: "press",     label: "Press kit" },
];

/** Default selection for a fresh project: just the App Store core. */
export const DEFAULT_SURFACES: string[] = ["ios-appstore"];

/** Plan eligibility check — used to gate Surface buttons. */
export function planAllows(plan: SurfacePlan, requires: SurfacePlan): boolean {
  const order: Record<SurfacePlan, number> = { free: 0, indie: 1, studio: 2 };
  return order[plan] >= order[requires];
}
