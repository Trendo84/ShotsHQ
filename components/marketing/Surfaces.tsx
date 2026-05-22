/**
 * Surfaces section — every place a single project renders to.
 *
 * Each surface tile is a true-to-aspect mini preview of the artifact,
 * with hover state. All previews share a tactical visual language
 * (thin lines, outlined frames, accent highlights, mono labels) so the
 * row reads as one cohesive product manifesto, not a patchwork of
 * disconnected mockups.
 */
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

/** Optional dedicated tool landing pages — surface-id → href map. */
const TOOL_ROUTES: Record<string, string> = {
  "web-hero":  "/tools/web-hero",
};

type Status = "Live" | "Beta" | "Soon";

type Surface = {
  id:          string;
  name:        string;
  spec:        string;
  status:      Status;
  description: string;
  /** width / height ratio for the mockup tile */
  aspect:      string;
  layout:
    | "appstore"
    | "wide-hero"
    | "og"
    | "ph-gallery"
    | "gh-banner"
    | "press-kit";
};

const SURFACES: Surface[] = [
  {
    id:          "appstore",
    name:        "App Store",
    spec:        "1290·2796 / 1320·2868 / 2064·2752",
    status:      "Live",
    description: "iPhone 6.9″, 6.7″ and iPad 13″ in one render pass. Per-locale auto-relayout.",
    aspect:      "16 / 11",
    layout:      "appstore",
  },
  {
    id:          "web-hero",
    name:        "Website hero",
    spec:        "1920·1080 / 2880·1620",
    status:      "Beta",
    description: "Drop-in for Framer / Webflow / your own stack. Same source, wide crop.",
    aspect:      "16 / 11",
    layout:      "wide-hero",
  },
  {
    id:          "og",
    name:        "OG / Twitter card",
    spec:        "1200 × 630",
    status:      "Beta",
    description: "Auto-generated per page. Locale-aware. Refreshes when copy changes.",
    aspect:      "16 / 11",
    layout:      "og",
  },
  {
    id:          "ph",
    name:        "Product Hunt",
    spec:        "1270×760 · 8 tiles + 240×240 icon",
    status:      "Beta",
    description: "Eight-tile gallery + topic icon + featured banner. Hunt-day ready.",
    aspect:      "16 / 11",
    layout:      "ph-gallery",
  },
  {
    id:          "gh",
    name:        "GitHub banner",
    spec:        "1280 × 640",
    status:      "Soon",
    description: "Repo social preview + README hero in one. SVG fallback included.",
    aspect:      "16 / 11",
    layout:      "gh-banner",
  },
  {
    id:          "press",
    name:        "Press kit",
    spec:        "ZIP · all surfaces + brand assets",
    status:      "Soon",
    description: "Logos, palette, type, every dimension above. One button, one URL to share.",
    aspect:      "16 / 11",
    layout:      "press-kit",
  },
];

export function Surfaces() {
  return (
    <section className="border-b border-[var(--line)] bg-[var(--bg-2)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">

        {/* Header */}
        <Reveal as="div" className="grid grid-cols-12 gap-8 mb-12 items-end">
          <div className="col-span-12 md:col-span-7">
            <div className="t-eyebrow t-eyebrow-accent mb-3">One project · every channel</div>
            <h2 className="t-display t-h-2 text-balance">
              Build it once, ship it to <span className="text-[var(--accent)]">every surface a launch actually needs</span>.
            </h2>
          </div>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md">
            One screenshot system for the App Store, marketing site, social cards, Product Hunt, GitHub, and press assets.
          </p>
        </Reveal>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)]">
          {SURFACES.map((s) => (
            <article
              key={s.id}
              className="surface-card group bg-[var(--bg)] flex flex-col transition-colors duration-300"
            >
              {/* Header strip */}
              <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-[var(--line)]">
                <div className="min-w-0">
                  <div className="t-mono-xs text-[var(--fg-mute)] mb-1 truncate tabular-nums">{s.spec}</div>
                  <h3 className="t-display text-[clamp(1.15rem,2.6vw,1.5rem)] leading-[0.95] tracking-[-0.02em]">
                    {s.name}
                  </h3>
                </div>
                <StatusPill status={s.status} />
              </header>

              {/* Mockup canvas — true aspect, dark backdrop */}
              <div
                className="relative w-full bg-[var(--bg-2)] overflow-hidden"
                style={{ aspectRatio: s.aspect }}
              >
                {/* Subtle dot grid behind every mockup — unifies the row */}
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.18] pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(color-mix(in srgb, var(--fg) 20%, transparent) 0.7px, transparent 1px)",
                    backgroundSize: "10px 10px",
                  }}
                />
                <SurfaceMockup layout={s.layout} />

                {/* Top-left aspect label */}
                <div
                  aria-hidden
                  className="absolute top-2 left-2 t-mono-xs text-[9px] tracking-[0.14em] text-[var(--fg-mute)] bg-[var(--bg)]/70 backdrop-blur px-1 py-0.5"
                >
                  {s.layout.toUpperCase()}
                </div>
              </div>

              {/* Footer description + (optional) tool CTA */}
              <div className="px-5 py-4 border-t border-[var(--line)] flex items-end justify-between gap-3">
                <p className="t-prose text-[12.5px] leading-snug min-w-0">{s.description}</p>
                {TOOL_ROUTES[s.id] && (
                  <Link
                    href={TOOL_ROUTES[s.id]!}
                    className="t-mono-xs uppercase tracking-[0.16em] text-[var(--accent)] hover:underline whitespace-nowrap shrink-0"
                  >
                    Try it →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .surface-card { transition: background-color 280ms ease, transform 280ms ease; }
        .surface-card:hover {
          background-color: color-mix(in srgb, var(--accent) 3%, var(--bg));
        }
        .surface-card:hover .surface-accent {
          color: var(--accent);
        }
        .surface-card:hover .surface-pill {
          border-color: var(--accent);
          color: var(--accent);
        }
      `}</style>
    </section>
  );
}

function StatusPill({ status }: { status: Status }) {
  // Three weights so the eye can rank them at a glance:
  //   Live  → solid fill, signal green               (strongest, "ship now")
  //   Beta  → outline accent + dot pulse             (medium, "available with caveats")
  //   Soon  → muted outline, no fill, no dot         (quietest, "not yet")
  // This matches the pill weights used by Linear / Notion changelogs and
  // tracks the casing system: ALL CAPS at 10px, never larger.
  const base =
    "surface-pill inline-flex items-center gap-1.5 t-mono-xs uppercase tracking-[0.14em] font-semibold px-2 py-0.5 shrink-0 transition-colors";

  if (status === "Live") {
    return (
      <span
        className={`${base} bg-[var(--signal)] text-[var(--bg)] border border-[var(--signal)]`}
      >
        <span className="block w-1.5 h-1.5 rounded-full bg-[var(--bg)] pulse-soft" aria-hidden />
        LIVE
      </span>
    );
  }
  if (status === "Beta") {
    return (
      <span
        className={`${base} text-[var(--accent)] border border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]`}
      >
        <span className="block w-1.5 h-1.5 rounded-full bg-[var(--accent)]" aria-hidden />
        BETA
      </span>
    );
  }
  return (
    <span
      className={`${base} text-[var(--fg-mute)] border border-[var(--line-strong)] opacity-80`}
    >
      SOON
    </span>
  );
}

// ── Mockups ──────────────────────────────────────────────────────────────────
// Cohesive visual language: dark canvas, thin outlined frames in fg-dim,
// accent-color highlights for the "live" element. Mono micro-labels everywhere.

function SurfaceMockup({ layout }: { layout: Surface["layout"] }) {
  if (layout === "appstore")    return <AppStoreMock />;
  if (layout === "wide-hero")   return <WebHeroMock />;
  if (layout === "og")          return <OgMock />;
  if (layout === "ph-gallery")  return <PhMock />;
  if (layout === "gh-banner")   return <GhMock />;
  return <PressKitMock />;
}

/* ── App Store ───────────────────────────────────────────────────────────── */
function AppStoreMock() {
  return (
    <div className="absolute inset-0 grid grid-cols-3 gap-2 p-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`flex flex-col gap-1 ${i === 1 ? "translate-y-[-4%]" : ""}`}
        >
          {/* Headline strip */}
          <div className="flex flex-col gap-0.5 px-0.5 mb-0.5">
            <div className={`h-[3px] ${i === 0 ? "w-[80%]" : i === 1 ? "w-[65%]" : "w-[72%]"} ${i === 1 ? "bg-[var(--accent)]" : "bg-[var(--fg)]"}`} />
            <div className="h-[2px] w-[55%] bg-[var(--fg-dim)]" />
          </div>
          {/* Phone silhouette */}
          <div className="relative flex-1 mx-auto w-[80%] bg-[#0A0A0E] border border-[var(--line-strong)] overflow-hidden" style={{ borderRadius: "5px" }}>
            <div className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[34%] h-[5%] bg-black rounded-full" />
            <div className="absolute inset-[6%] top-[14%] bg-[var(--bg-2)] flex flex-col gap-1 p-1.5 overflow-hidden" style={{ borderRadius: "3px" }}>
              <div className={`h-1 w-2/3 ${i === 1 ? "bg-[var(--accent)]" : "bg-[var(--fg)]"}`} />
              <div className="h-px w-1/2 bg-[var(--fg-dim)] mt-0.5" />
              <div className="flex-1 grid grid-cols-2 gap-px mt-1">
                <div className="bg-[var(--bg)]" />
                <div className="bg-[var(--bg)]" />
                <div className="bg-[var(--bg)]" />
                <div className={i === 1 ? "bg-[var(--accent)]" : "bg-[var(--bg)]"} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Web Hero ────────────────────────────────────────────────────────────── */
function WebHeroMock() {
  return (
    <div className="absolute inset-3">
      {/* Browser frame */}
      <div className="absolute inset-0 border border-[var(--line-strong)] bg-[var(--bg)] flex flex-col">
        {/* Chrome */}
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[var(--line)] shrink-0">
          <span className="block w-1.5 h-1.5 rounded-full bg-[var(--fg-dim)]" />
          <span className="block w-1.5 h-1.5 rounded-full bg-[var(--fg-dim)]" />
          <span className="block w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          <span className="ml-2 t-mono-xs text-[8px] text-[var(--fg-mute)] truncate flex-1">shotshq.com</span>
        </div>
        {/* Hero body */}
        <div className="flex-1 flex items-center gap-2 px-3 py-2">
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-[5px] w-[85%] bg-[var(--fg)]" />
            <div className="h-[5px] w-[70%] bg-[var(--accent)]" />
            <div className="h-[2px] w-[55%] bg-[var(--fg-dim)] mt-1" />
            <div className="h-[6px] w-[28%] bg-[var(--accent)] mt-1.5" />
          </div>
          {/* Right-side phone */}
          <div className="relative w-[26%] aspect-[9/19] bg-[#0A0A0E] border border-[var(--line-strong)] overflow-hidden shrink-0" style={{ borderRadius: "3px" }}>
            <div className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[28%] h-[3%] bg-black rounded-full" />
            <div className="absolute inset-[8%] top-[14%] bg-[var(--accent)]/25" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── OG / Twitter Card ───────────────────────────────────────────────────── */
function OgMock() {
  return (
    <div className="absolute inset-3 border border-[var(--line-strong)] bg-[var(--bg)] flex flex-col overflow-hidden">
      {/* Image area */}
      <div className="flex-1 relative bg-gradient-to-br from-[color-mix(in_srgb,var(--accent)_30%,var(--bg-2))] to-[var(--bg-2)] p-2">
        <div className="absolute top-2 left-2 t-mono-xs text-[8px] tracking-[0.14em] text-[var(--fg-mute)]">
          SHOTSHQ.COM
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5">
          <div className="h-[6px] w-[70%] bg-[var(--fg)]" />
          <div className="h-[6px] w-[50%] bg-[var(--accent)]" />
        </div>
        {/* Tiny phone in corner */}
        <div className="absolute bottom-3 right-3 w-[14%] aspect-[9/19] bg-[#0A0A0E] border border-[var(--line-strong)]" style={{ borderRadius: "2px" }} />
      </div>
      {/* Meta strip */}
      <div className="px-2 py-1.5 border-t border-[var(--line)] flex items-center gap-1.5">
        <span className="block w-2 h-2 bg-[var(--accent)]" />
        <span className="h-[3px] flex-1 bg-[var(--fg-mute)]" />
      </div>
    </div>
  );
}

/* ── Product Hunt ────────────────────────────────────────────────────────── */
function PhMock() {
  return (
    <div className="absolute inset-3 flex flex-col gap-1.5">
      {/* Featured tile */}
      <div className="flex-[1.4] relative bg-[var(--bg)] border border-[var(--line-strong)] overflow-hidden">
        <div className="absolute top-1.5 left-1.5 t-mono-xs text-[8px] tracking-[0.14em] text-[var(--accent)]">
          ▲ PRODUCT HUNT
        </div>
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-col gap-0.5">
          <div className="h-[5px] w-[75%] bg-[var(--fg)]" />
          <div className="h-[3px] w-[50%] bg-[var(--accent)]" />
        </div>
      </div>
      {/* Gallery row */}
      <div className="grid grid-cols-4 gap-1 flex-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`border border-[var(--line)] ${i === 0 ? "bg-[var(--accent)]/30 border-[var(--accent)]" : "bg-[var(--bg)]"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── GitHub Banner ───────────────────────────────────────────────────────── */
function GhMock() {
  return (
    <div className="absolute inset-3 border border-[var(--line-strong)] bg-[var(--bg)] flex flex-col overflow-hidden">
      {/* Repo header */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-[var(--line)]">
        <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor" className="text-[var(--fg-mute)] shrink-0">
          <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.7-.01-1.36-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        <span className="t-mono-xs text-[8px] text-[var(--fg-dim)] truncate">trendo84 / shotshq</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="t-mono-xs text-[8px] text-[var(--fg-mute)]">★</span>
          <span className="t-mono-xs text-[8px] text-[var(--fg-mute)] tabular-nums">2.4k</span>
        </span>
      </div>
      {/* Banner */}
      <div className="flex-1 relative bg-gradient-to-br from-[var(--bg-2)] via-[color-mix(in_srgb,var(--accent)_8%,var(--bg-2))] to-[var(--bg-2)] p-2.5">
        <div className="flex flex-col gap-0.5 mt-1">
          <div className="h-[5px] w-[70%] bg-[var(--fg)]" />
          <div className="h-[5px] w-[55%] bg-[var(--accent)]" />
          <div className="h-[2px] w-[60%] bg-[var(--fg-dim)] mt-1" />
        </div>
      </div>
    </div>
  );
}

/* ── Press Kit ───────────────────────────────────────────────────────────── */
function PressKitMock() {
  // Curated tile content: logo, palette, type, sizes, ZIP CTA.
  return (
    <div className="absolute inset-3 grid grid-cols-3 grid-rows-3 gap-1 bg-[var(--line)] p-px">
      {/* Logo */}
      <div className="bg-[var(--bg)] flex items-center justify-center">
        <span className="block w-2 h-2 bg-[var(--accent)]" />
      </div>
      {/* Type */}
      <div className="bg-[var(--bg)] flex items-center justify-center">
        <span className="t-display text-[14px] leading-none">Aa</span>
      </div>
      {/* Palette */}
      <div className="bg-[var(--bg)] flex">
        <div className="flex-1 bg-[var(--accent)]" />
        <div className="flex-1 bg-[var(--fg)]" />
        <div className="flex-1 bg-[var(--bg-2)]" />
        <div className="flex-1 bg-[var(--fg-mute)]" />
      </div>
      {/* App Store size */}
      <div className="bg-[var(--bg)] flex items-center justify-center">
        <span className="t-mono-xs text-[8px] text-[var(--fg-dim)]">6.9″</span>
      </div>
      {/* Banner size */}
      <div className="bg-[var(--bg)] flex items-center justify-center">
        <span className="t-mono-xs text-[8px] text-[var(--fg-dim)]">16:9</span>
      </div>
      {/* OG size */}
      <div className="bg-[var(--bg)] flex items-center justify-center">
        <span className="t-mono-xs text-[8px] text-[var(--fg-dim)]">OG</span>
      </div>
      {/* Phone tile */}
      <div className="bg-[var(--bg)] flex items-center justify-center">
        <div className="w-1.5 h-3 border border-[var(--fg-dim)]" />
      </div>
      {/* Wide tile */}
      <div className="bg-[var(--bg)] flex items-center justify-center">
        <div className="w-3 h-1.5 border border-[var(--fg-dim)]" />
      </div>
      {/* ZIP CTA */}
      <div className="bg-[color-mix(in_srgb,var(--accent)_18%,var(--bg))] border border-[var(--accent)] flex items-center justify-center">
        <span className="t-mono-xs text-[var(--accent)] tracking-[0.14em] font-semibold">ZIP</span>
      </div>
    </div>
  );
}
