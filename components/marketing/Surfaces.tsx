/**
 * Surfaces section — what a single source ships to.
 *
 * Morning-finish rebalance: this used to be a 6-card grid with one Live
 * surface (App Store) competing with three Beta surfaces and two Soon
 * surfaces at equal visual weight. The brief: "App Store should be the
 * unquestioned primary live outcome. Web hero can remain as a secondary
 * 'coming next' surface. OG / Product Hunt / GitHub banner / Press kit
 * should be visually demoted into a quieter 'coming next' cluster."
 *
 * The new layout:
 *   - One full-width "App Store · live today" hero panel with its own
 *     mockup, dimensions list, and prominent Try-it path.
 *   - Below: a quieter "Coming next" row of 5 compact tiles (web hero
 *     + 4 others). No big badges in the main scan path; the row reads
 *     "expansion is coming, but the live product is one focused thing."
 *
 * The web-hero tile carries `Preview →` (was "Try it →") — expectation-
 * setting language so users never feel tricked into landing on a
 * well-designed page for an unreleased tool.
 */
import Link from "next/link";

type ComingNextSurface = {
  id:          string;
  name:        string;
  spec:        string;
  description: string;
  href?:       string;
  /** Override CTA label per surface (default "Coming next"). */
  cta?:        string;
};

const COMING_NEXT: ComingNextSurface[] = [
  {
    id:          "web-hero",
    name:        "Website hero",
    spec:        "1920·1080 → 4K",
    description: "Drop-in for Framer, Webflow, Next.js. Same source, wide crop.",
    href:        "/tools/web-hero",
    cta:         "Preview →",
  },
  {
    id:          "og",
    name:        "OG / Twitter card",
    spec:        "1200 × 630",
    description: "Auto-generated per page. Locale-aware. Refreshes when copy changes.",
  },
  {
    id:          "ph",
    name:        "Product Hunt",
    spec:        "1270·760 × 8 + 240·240",
    description: "Eight-tile gallery + topic icon + featured banner.",
  },
  {
    id:          "gh",
    name:        "GitHub banner",
    spec:        "1280 × 640",
    description: "Repo social preview + README hero in one. SVG fallback included.",
  },
  {
    id:          "press",
    name:        "Press kit",
    spec:        "ZIP · brand + surfaces",
    description: "Logos, palette, type, every dimension above — one URL to share.",
  },
];

export function Surfaces() {
  return (
    <section className="border-b border-[var(--line)] bg-[var(--bg-2)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">

        {/* Header */}
        <div className="grid grid-cols-12 gap-8 mb-10 lg:mb-12 items-end">
          <div className="col-span-12 md:col-span-7">
            <div className="t-eyebrow t-eyebrow-accent mb-3">One source · every channel</div>
            <h2 className="t-display t-h-2 text-balance">
              Polished App Store packs today.{" "}
              <span className="text-[var(--accent)]">Everything else next.</span>
            </h2>
          </div>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md text-[var(--fg)]">
            The App Store pipeline is live and shipping now. Adjacent
            surfaces — website heroes, OG cards, Product Hunt, GitHub,
            press kits — come next on the same engine.
          </p>
        </div>

        {/* ── PRIMARY · App Store ────────────────────────────────────── */}
        <article
          className="bg-[var(--bg)] border border-[var(--line)] grid grid-cols-12 mb-6 lg:mb-8 overflow-hidden"
          data-surface-id="appstore"
          data-surface-status="live"
        >
          {/* Live mockup — gets the whole left half on desktop */}
          <div className="col-span-12 lg:col-span-7 border-b lg:border-b-0 lg:border-r border-[var(--line)] relative bg-[var(--bg-2)] min-h-[280px] sm:min-h-[340px] lg:min-h-[420px]">
            {/* Subtle dot grid — same visual language as the original */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.14] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(color-mix(in srgb, var(--fg) 20%, transparent) 0.8px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            />
            <AppStoreMock />
          </div>

          {/* Right half — pitch + dimensions + CTA */}
          <div className="col-span-12 lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
              <div className="t-eyebrow t-eyebrow-accent">Live today</div>
              <LivePill />
            </div>

            <h3 className="t-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[0.95] tracking-[-0.02em] normal-case">
              App Store pack
            </h3>

            <p className="t-prose text-[var(--fg)] leading-relaxed">
              iPhone 6.9″, iPhone 6.7″, and iPad 13″ in one render pass.
              Per-locale auto-relayout. Pixel-exact at the dimensions
              App Store Connect actually wants.
            </p>

            <ul className="space-y-1.5 t-mono-sm text-[var(--fg-dim)] leading-snug">
              <li>▸ 1290 × 2796  ·  iPhone 6.9″</li>
              <li>▸ 1320 × 2868  ·  iPhone 6.7″</li>
              <li>▸ 2064 × 2752  ·  iPad 13″</li>
            </ul>

            <div className="mt-auto pt-3 flex flex-wrap items-center gap-4">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-5 pr-1.5 py-2 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
              >
                <span className="btn-label">Start free</span>
                <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform group-hover:translate-x-0.5 font-bold">→</span>
              </Link>
              <Link
                href="/templates"
                className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--accent)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)] transition-colors"
              >
                See sample output →
              </Link>
            </div>
          </div>
        </article>

        {/* ── COMING NEXT · quieter row ──────────────────────────────── */}
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <span className="t-eyebrow text-[var(--fg-mute)]">Coming next</span>
          <span className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em] hidden sm:inline">
            5 surfaces · same engine · same source
          </span>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-[var(--line)] border border-[var(--line)]">
          {COMING_NEXT.map((s) => {
            const inner = (
              <article
                className="h-full bg-[var(--bg)] p-4 sm:p-5 flex flex-col gap-2 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_3%,var(--bg))]"
                data-surface-id={s.id}
                data-surface-status="coming-next"
              >
                <div className="t-mono-xs text-[var(--fg-mute)] tabular-nums truncate">
                  {s.spec}
                </div>
                <h4 className="t-display text-[clamp(1rem,2vw,1.25rem)] leading-tight tracking-[-0.02em] normal-case">
                  {s.name}
                </h4>
                <p className="text-[12.5px] text-[var(--fg-dim)] leading-snug flex-1">
                  {s.description}
                </p>
                {s.cta && (
                  <span className="t-mono-xs uppercase tracking-[0.16em] text-[var(--accent)] mt-1">
                    {s.cta}
                  </span>
                )}
              </article>
            );
            return (
              <li key={s.id}>
                {s.href ? (
                  <Link href={s.href} className="block h-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 t-mono-xs uppercase tracking-[0.14em] font-semibold px-2 py-0.5 bg-[var(--signal)] text-[var(--bg)] border border-[var(--signal)]">
      <span aria-hidden className="block w-1.5 h-1.5 rounded-full bg-[var(--bg)] pulse-soft" />
      LIVE
    </span>
  );
}

// ── Mockup ───────────────────────────────────────────────────────────
// Single mockup — the App Store pack — sized larger and centered in the
// new hero panel. The five "coming next" tiles are spec-only by design;
// adding mini mockups would compete visually with the live one.

function AppStoreMock() {
  return (
    <div className="absolute inset-0 grid grid-cols-3 gap-3 sm:gap-4 p-5 sm:p-8 lg:p-10">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`flex flex-col gap-1.5 ${i === 1 ? "translate-y-[-4%]" : ""}`}
        >
          {/* Headline strip */}
          <div className="flex flex-col gap-1 px-0.5 mb-1">
            <div className={`h-[5px] ${i === 0 ? "w-[80%]" : i === 1 ? "w-[65%]" : "w-[72%]"} ${i === 1 ? "bg-[var(--accent)]" : "bg-[var(--fg)]"}`} />
            <div className="h-[3px] w-[55%] bg-[var(--fg-dim)]" />
          </div>
          {/* Phone silhouette */}
          <div className="relative flex-1 mx-auto w-[80%] bg-[#0A0A0E] border border-[var(--line-strong)] overflow-hidden" style={{ borderRadius: "6px" }}>
            <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[34%] h-[4%] bg-black rounded-full" />
            <div className="absolute inset-[6%] top-[12%] bg-[var(--bg-2)] flex flex-col gap-1 p-2 overflow-hidden" style={{ borderRadius: "3px" }}>
              <div className={`h-1.5 w-2/3 ${i === 1 ? "bg-[var(--accent)]" : "bg-[var(--fg)]"}`} />
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
