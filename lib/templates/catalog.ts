/**
 * Canonical templates catalog. Pure data — no JSX, no React.
 *
 * Two consumers:
 *   1. `components/marketing/Templates.tsx` — renders the gallery,
 *      transforms the data fields into headline JSX inline.
 *   2. `app/(app)/projects/new/page.tsx` — seeds the wizard form when
 *      the URL has `?template=<slug>`.
 *
 * Headlines are stored as `headlineLines: [string, string]` rather than
 * JSX. Line 2 always renders in the template's accent color. The
 * `headlineStyle` flag controls typography variants (italic serif for
 * the editorial templates).
 *
 * Tier field stays as `tag: "Free" | "Pro"` for now — the v1.1 work in
 * `docs/issues/v1.1-template-tier-gating.md` renames to lowercase
 * `tier` when the gating logic lands.
 */

export type TemplateDecor =
  | "ring" | "wave" | "bars" | "stack" | "halftone"
  | "stripe" | "grid" | "orbit" | "ledger" | "blocks";

export type Template = {
  slug:           string;
  name:           string;
  category:       string;
  tag:            "Free" | "Pro";
  bg:             string;
  fg:             string;
  accent:         string;
  decor:          TemplateDecor;
  headlineLines:  [string, string];
  /** `default` = bold display; `italic-serif-line2` = line 2 in EB Garamond italic;
   *  `italic-serif-all` = both lines in EB Garamond italic. */
  headlineStyle:  "default" | "italic-serif-line2" | "italic-serif-all";
  subhead:        string;
};

export const TEMPLATES: Template[] = [
  { slug: "mono-punch",       name: "Mono Punch",       category: "Productivity",      tag: "Free", bg: "#0E0E0E", fg: "#F5F5F5", accent: "#FF2A2A", decor: "stripe",   headlineLines: ["Ship", "fast."],          headlineStyle: "default",            subhead: "One tap, one screen." },
  { slug: "soft-sunrise",     name: "Soft Sunrise",     category: "Health & fitness",  tag: "Free", bg: "#FBE8D6", fg: "#2A1810", accent: "#E85A2C", decor: "ring",     headlineLines: ["Wake.", "Move."],         headlineStyle: "default",            subhead: "Gentle morning rituals." },
  { slug: "tideline",         name: "Tideline",         category: "Travel & weather",  tag: "Free", bg: "#0E1A24", fg: "#F5F7FA", accent: "#3CC8FF", decor: "wave",     headlineLines: ["Catch the", "swell."],    headlineStyle: "default",            subhead: "Tide · Wind · Wave height" },
  { slug: "indie-grid",       name: "Indie Grid",       category: "Photo & video",     tag: "Free", bg: "#F4F4F0", fg: "#0A0A0A", accent: "#0A0A0A", decor: "bars",     headlineLines: ["Curate", "everything."],  headlineStyle: "italic-serif-line2", subhead: "Library, framed." },
  { slug: "hazard-stripe",    name: "Hazard Stripe",    category: "Utilities",         tag: "Pro",  bg: "#0A0A0A", fg: "#FFFFFF", accent: "#FFC233", decor: "halftone", headlineLines: ["Caution.", "Useful."],    headlineStyle: "default",            subhead: "Tools that get out of the way." },
  { slug: "pastel-pop",       name: "Pastel Pop",       category: "Kids & lifestyle",  tag: "Pro",  bg: "#E0F4DE", fg: "#103820", accent: "#FF6B9D", decor: "stack",    headlineLines: ["Soft", "+ silly."],        headlineStyle: "default",            subhead: "Made for tiny humans." },
  { slug: "editorial-print",  name: "Editorial Print",  category: "News & magazine",   tag: "Pro",  bg: "#F4F1E8", fg: "#1A1A1A", accent: "#A02020", decor: "halftone", headlineLines: ["Read", "longer."],        headlineStyle: "italic-serif-all",   subhead: "Stories that hold attention." },
  { slug: "tactical-dark",    name: "Tactical Dark",    category: "Gaming & tools",    tag: "Pro",  bg: "#050810", fg: "#D8E0F0", accent: "#4AF626", decor: "stripe",   headlineLines: ["Lock.", "Load."],          headlineStyle: "default",            subhead: "Pro-grade controls." },
  { slug: "midnight-mono",    name: "Midnight Mono",    category: "Finance & crypto",  tag: "Pro",  bg: "#0B0E14", fg: "#E5E7EB", accent: "#7DF9FF", decor: "ledger",   headlineLines: ["Track", "everything."],   headlineStyle: "default",            subhead: "Real-time portfolio." },
  { slug: "paper-cut",        name: "Paper Cut",        category: "Books & reading",   tag: "Free", bg: "#EFEAE0", fg: "#1C1C1C", accent: "#C2410C", decor: "halftone", headlineLines: ["Stay", "curious."],       headlineStyle: "italic-serif-line2", subhead: "A library in your pocket." },
  { slug: "neon-pulse",       name: "Neon Pulse",       category: "Music & audio",     tag: "Pro",  bg: "#0A0118", fg: "#F5E6FF", accent: "#FF14B8", decor: "wave",     headlineLines: ["Feel the", "frequency."], headlineStyle: "default",            subhead: "Spatial audio engine." },
  { slug: "stadium-bold",     name: "Stadium Bold",     category: "Sports & live",     tag: "Free", bg: "#0E1A0E", fg: "#F5FFF5", accent: "#00FF6A", decor: "blocks",   headlineLines: ["Game.", "On."],           headlineStyle: "default",            subhead: "Every result, live." },
  { slug: "atelier-grid",     name: "Atelier Grid",     category: "Design & creative", tag: "Pro",  bg: "#FAFAF7", fg: "#0A0A0A", accent: "#0A0A0A", decor: "grid",     headlineLines: ["Build", "better."],       headlineStyle: "italic-serif-line2", subhead: "A studio for makers." },
  { slug: "ember-pitch",      name: "Ember Pitch",      category: "Travel & maps",     tag: "Free", bg: "#1A0E08", fg: "#FBE7CE", accent: "#FF8A3D", decor: "orbit",    headlineLines: ["Go", "further."],         headlineStyle: "default",            subhead: "Routes, refined." },
  { slug: "vault-blue",       name: "Vault Blue",       category: "Security & VPN",    tag: "Pro",  bg: "#08152B", fg: "#DCEAFF", accent: "#3B82F6", decor: "grid",     headlineLines: ["Locked.", "Tight."],      headlineStyle: "default",            subhead: "Zero-trust, by default." },
  { slug: "command-center",   name: "Command Center",   category: "Business & CRM",    tag: "Pro",  bg: "#11130F", fg: "#F2F0E8", accent: "#D6FF4F", decor: "ledger",   headlineLines: ["Close", "more."],         headlineStyle: "default",            subhead: "Pipeline, calls, follow-up." },
  { slug: "clay-ledger",      name: "Clay Ledger",      category: "Budgeting",         tag: "Free", bg: "#E9D9C3", fg: "#231914", accent: "#0F766E", decor: "bars",     headlineLines: ["Spend", "smarter."],      headlineStyle: "default",            subhead: "Budgets without noise." },
  { slug: "aurora-care",      name: "Aurora Care",      category: "Wellness",          tag: "Free", bg: "#151221", fg: "#F8F2FF", accent: "#A7F3D0", decor: "orbit",    headlineLines: ["Feel", "steady."],        headlineStyle: "default",            subhead: "Mood, sleep, recovery." },
  { slug: "signal-lab",       name: "Signal Lab",       category: "Developer tools",   tag: "Pro",  bg: "#061416", fg: "#DFF7F4", accent: "#F97316", decor: "grid",     headlineLines: ["Debug", "faster."],       headlineStyle: "default",            subhead: "Logs, traces, deploys." },
  { slug: "market-bloom",     name: "Market Bloom",     category: "Shopping",          tag: "Free", bg: "#FFF7ED", fg: "#20130B", accent: "#DB2777", decor: "stack",    headlineLines: ["Sell", "beautifully."],   headlineStyle: "default",            subhead: "Drop, cart, checkout." },
  { slug: "atlas-route",      name: "Atlas Route",      category: "Navigation",        tag: "Pro",  bg: "#10251F", fg: "#ECFDF5", accent: "#FACC15", decor: "wave",     headlineLines: ["Find", "the way."],       headlineStyle: "default",            subhead: "Trips, stops, timing." },
];

export const TEMPLATES_BY_SLUG: Record<string, Template> = Object.fromEntries(
  TEMPLATES.map((t) => [t.slug, t]),
);

export const TEMPLATE_COUNT = TEMPLATES.length;
