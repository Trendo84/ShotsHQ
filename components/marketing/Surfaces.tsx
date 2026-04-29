/**
 * Surfaces section — every place a single project renders to. The
 * same source screens fan out into App Store screenshots, web hero
 * shots, OG cards, Product Hunt galleries, GitHub banners, and a
 * press-kit zip. One project, every channel a launch needs.
 *
 * Each tile is a true-to-aspect mockup — not the actual artifact —
 * showing the surface's signature layout in micro form.
 */

type Surface = {
  id: string;
  name: string;
  spec: string;
  status: "Live" | "Beta" | "Soon";
  description: string;
  /** width / height ratio for the mockup tile */
  aspect: string;
  /** how the inner mockup composes */
  layout: "appstore" | "wide-hero" | "og" | "ph-gallery" | "gh-banner" | "press-kit";
};

const SURFACES: Surface[] = [
  {
    id: "appstore",
    name: "App Store",
    spec: "1290 × 2796 · 1320 × 2868 · 2064 × 2752",
    status: "Live",
    description: "iPhone 6.9″, 6.7″ and iPad 13″ in one render pass. Per-locale auto-relayout.",
    aspect: "9 / 19.5",
    layout: "appstore",
  },
  {
    id: "web-hero",
    name: "Website hero",
    spec: "1920 × 1080 · 2880 × 1620",
    status: "Beta",
    description: "Drop-in for Framer / Webflow / your own marketing site. Same source, wide crop.",
    aspect: "16 / 9",
    layout: "wide-hero",
  },
  {
    id: "og",
    name: "OG / Twitter card",
    spec: "1200 × 630",
    status: "Beta",
    description: "Auto-generated per page, locale-aware, refreshes when copy changes.",
    aspect: "1200 / 630",
    layout: "og",
  },
  {
    id: "ph",
    name: "Product Hunt",
    spec: "1270 × 760 · gallery × 8",
    status: "Soon",
    description: "Exact dimensions, exact aspect, eight-tile gallery formatted for hunt day.",
    aspect: "127 / 76",
    layout: "ph-gallery",
  },
  {
    id: "gh",
    name: "GitHub banner",
    spec: "1280 × 640",
    status: "Soon",
    description: "Repo social preview + README hero in one. SVG fallback included.",
    aspect: "2 / 1",
    layout: "gh-banner",
  },
  {
    id: "press",
    name: "Press kit",
    spec: "ZIP · all surfaces + brand assets",
    status: "Soon",
    description: "Logos, palette, type, every dimension above. One button, one URL to share.",
    aspect: "4 / 3",
    layout: "press-kit",
  },
];

export function Surfaces() {
  return (
    <section className="border-b border-[var(--line)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-8 mb-12 items-end">
          <div className="col-span-12 md:col-span-7">
            <div className="t-eyebrow t-eyebrow-accent mb-3">One project · every channel</div>
            <h2 className="t-display text-[clamp(2rem,5.5vw,4.5rem)] leading-[0.95] text-balance">
              Six surfaces.<br />
              <span className="text-[var(--accent)]">One render.</span>
            </h2>
          </div>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md">
            Drop your screens in once. ShotsHQ fans them out to every
            channel a launch needs — App Store, your marketing site,
            Twitter cards, Product Hunt, GitHub. Same brand, every aspect.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)]">
          {SURFACES.map((s) => (
            <article
              key={s.id}
              className="bg-[var(--bg)] p-5 md:p-6 flex flex-col gap-4 min-h-[320px]"
            >
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="t-mono-xs text-[var(--fg-mute)] mb-1 truncate">{s.spec}</div>
                  <h3 className="t-display text-[clamp(1.25rem,3vw,1.5rem)] leading-[0.95] tracking-[-0.02em]">{s.name}</h3>
                </div>
                <StatusPill status={s.status} />
              </header>

              <div
                className="relative w-full bg-[var(--bg-2)] border border-[var(--line)] overflow-hidden"
                style={{ aspectRatio: s.aspect }}
              >
                <SurfaceMockup layout={s.layout} />
              </div>

              <p className="t-prose text-[13px] mt-auto leading-snug">{s.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: Surface["status"] }) {
  const cfg = {
    Live: { fg: "var(--signal)", border: "var(--signal)" },
    Beta: { fg: "var(--accent)", border: "var(--accent)" },
    Soon: { fg: "var(--fg-mute)", border: "var(--line-strong)" },
  }[status];
  return (
    <span
      className="t-mono-xs uppercase tracking-[0.14em] font-semibold px-1.5 py-0.5 shrink-0"
      style={{ color: cfg.fg, border: `1px solid ${cfg.border}` }}
    >
      {status}
    </span>
  );
}

/* ────────────────────────────────────────────────
   Surface mockups — micro versions of each artifact.
   Only structural primitives, no real assets.
   ──────────────────────────────────────────────── */

function SurfaceMockup({ layout }: { layout: Surface["layout"] }) {
  if (layout === "appstore")    return <AppStoreMock />;
  if (layout === "wide-hero")   return <WideHeroMock />;
  if (layout === "og")          return <OgMock />;
  if (layout === "ph-gallery")  return <PhMock />;
  if (layout === "gh-banner")   return <GhMock />;
  return <PressKitMock />;
}

function AppStoreMock() {
  return (
    <div className="absolute inset-0 grid grid-cols-3 gap-1 p-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-[var(--bg)] border border-[var(--line)] flex flex-col p-1.5 gap-1">
          <div className="h-1.5 w-3/4 bg-[var(--accent)]" />
          <div className="h-1 w-1/2 bg-[var(--fg-mute)]" />
          <div className="flex-1 mt-1 bg-[var(--bg-2)] border border-[var(--line)]" />
        </div>
      ))}
    </div>
  );
}

function WideHeroMock() {
  return (
    <div className="absolute inset-0 flex items-stretch">
      <div className="flex-1 flex flex-col justify-center gap-1.5 p-3">
        <div className="h-2 w-3/4 bg-[var(--fg)]" />
        <div className="h-2 w-2/3 bg-[var(--accent)]" />
        <div className="h-1 w-1/2 bg-[var(--fg-mute)] mt-1" />
        <div className="h-3 w-16 bg-[var(--accent)] mt-2" />
      </div>
      <div className="w-1/3 flex items-center justify-center p-3">
        <div className="w-10 h-20 bg-[var(--bg)] border border-[var(--line-strong)]" />
      </div>
    </div>
  );
}

function OgMock() {
  return (
    <div className="absolute inset-0 flex flex-col p-3 gap-1.5">
      <div className="t-mono-xs text-[var(--fg-mute)] tracking-[0.16em]">SHOTSHQ.APP</div>
      <div className="h-2 w-4/5 bg-[var(--fg)] mt-auto" />
      <div className="h-2 w-3/5 bg-[var(--accent)]" />
      <div className="flex items-center gap-1.5 mt-1">
        <span className="block w-3 h-3 bg-[var(--accent)]" />
        <span className="h-1 w-1/3 bg-[var(--fg-mute)]" />
      </div>
    </div>
  );
}

function PhMock() {
  return (
    <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-px p-1.5 bg-[var(--line)]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--bg)] flex items-center justify-center"
          style={{
            background: i === 0 ? "var(--accent)" : "var(--bg)",
          }}
        />
      ))}
    </div>
  );
}

function GhMock() {
  return (
    <div className="absolute inset-0 flex flex-col p-3">
      <div className="flex items-center gap-1.5">
        <span className="block w-2 h-2 bg-[var(--accent)]" />
        <span className="block w-2 h-2 bg-[var(--fg-mute)]" />
        <span className="block w-2 h-2 bg-[var(--fg-mute)]" />
        <span className="t-mono-xs text-[var(--fg-mute)] ml-2 tracking-[0.12em]">README.MD</span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <div className="h-3 w-2/3 bg-[var(--fg)]" />
        <div className="h-3 w-1/2 bg-[var(--accent)]" />
        <div className="h-1 w-3/4 bg-[var(--fg-mute)] mt-1" />
      </div>
    </div>
  );
}

function PressKitMock() {
  // 9 asset tiles in a 3×3, the last one is the "ZIP" call-to-action tile.
  const HIGHLIGHT_INDEX = 4;
  return (
    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px p-1.5 bg-[var(--line)]">
      {Array.from({ length: 9 }).map((_, i) => {
        const isHighlight = i === HIGHLIGHT_INDEX;
        const isZip = i === 8;
        return (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{
              background: isHighlight ? "var(--accent)" : "var(--bg)",
              outline: isZip ? "1px dashed var(--accent)" : "none",
              outlineOffset: "-2px",
            }}
          >
            {isZip ? (
              <span className="t-mono-xs text-[var(--accent)] tracking-[0.12em]">ZIP</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
