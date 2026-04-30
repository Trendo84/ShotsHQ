import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";

type Feature = {
  code:   string;
  title:  string;
  body:   string;
  spec:   string;
  /** Optional inline visual that shows the module's transformation. */
  visual?: ReactNode;
};

const FEATURES: Feature[] = [
  {
    code:   "01",
    title:  "AI copy",
    body:   "Frontier-class language model writes headlines, subheadlines, and CTAs. Fixed-length, never malformed.",
    spec:   "1 cr / gen",
    visual: <CopyVisual />,
  },
  {
    code:   "02",
    title:  "Backdrops",
    body:   "Same screenshot, fresh palette. AI swaps the surrounding scene around your app — your UI stays untouched.",
    spec:   "2 cr / gen",
    visual: <BackdropsVisual />,
  },
  {
    code:   "03",
    title:  "Restyle",
    body:   "Drop in a reference photo. The AI lifts its palette, mood, and lighting — then re-skins your whole pack to match it.",
    spec:   "3 cr / gen",
    visual: <RestyleVisual />,
  },
  {
    code:   "04",
    title:  "41 locales",
    body:   "Every language in parallel. RTL and CJK auto-relayout, glyph-aware kerning, no clipped text — anywhere.",
    spec:   "1 cr / loc",
    visual: <LocalesVisual />,
  },
  {
    code:   "05",
    title:  "Device frames",
    body:   "iPhone 6.9″ / 6.7″ / iPad 13″ M4. Crisp masters, dynamic-island accurate, every safe area honoured.",
    spec:   "Free",
    visual: <DevicesVisual />,
  },
  {
    code:   "06",
    title:  "Direct upload",
    body:   "Push generated assets to App Store Connect. Per-locale, per-device, zero filename gymnastics.",
    spec:   "Free",
    visual: <UploadVisual />,
  },
];

export function FeatureGrid() {
  return (
    <section className="border-b border-[var(--line)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">
        <Reveal as="div" className="grid grid-cols-12 gap-8 mb-14 items-end">
          <h2 className="col-span-12 md:col-span-7 t-display text-[clamp(2rem,5.5vw,4.5rem)] leading-[0.95] text-balance">
            Six modules.<br />
            No junk drawer.
          </h2>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md">
            Each module deploys independently, bills independently, refunds on
            failure. Studio subscribers skip the meter entirely.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)]">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.code}
              as="article"
              delay={Math.min(i * 50, 250)}
              y={16}
              className="bg-[var(--bg)] p-7 min-h-[280px] flex flex-col"
            >
              <header className="flex items-start justify-between mb-5">
                <span className="t-eyebrow t-numeric">{f.code}</span>
                <span className="t-eyebrow text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[var(--accent)] px-1.5 py-0.5 normal-case tracking-[0.05em]">
                  {f.spec}
                </span>
              </header>
              <h3 className="t-display text-[clamp(1.75rem,3vw,2rem)] leading-[0.95] mb-3">{f.title}</h3>
              <p className="t-prose text-[14px] mb-5">{f.body}</p>

              {f.visual && (
                <div className="mt-auto pt-4 border-t border-[var(--line)]">
                  {f.visual}
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Visual examples ──────────────────────────────────────────────────────────
//
// Each visual reads as a tiny "transformation diagram" — input on the left,
// arrow, output on the right. Same visual language across all three so the
// modules feel like one system. Uses pure SVG/HTML, no images.

function CopyVisual() {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center" aria-hidden>
      {/* Input — raw app description */}
      <MiniBox label="INPUT" tone="mute">
        <div className="text-[8px] font-mono text-[var(--fg-mute)] leading-tight">
          &quot;A meal planner that uses your pantry...&quot;
        </div>
      </MiniBox>
      <Arrow />
      {/* Output — structured headline */}
      <MiniBox label="OUTPUT" tone="accent">
        <div className="text-[10px] font-bold leading-tight text-[var(--fg)]">
          COOK MORE.
        </div>
        <div className="text-[7px] text-[var(--fg-mute)] mt-0.5 leading-tight">
          Waste less.
        </div>
      </MiniBox>
    </div>
  );
}

function BackdropsVisual() {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center" aria-hidden>
      {/* Input — phone with stock backdrop */}
      <MiniBox label="BEFORE" tone="mute">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-[var(--bg-2)]" />
          <MiniPhone screenColor="#3CC8FF" />
        </div>
      </MiniBox>
      <Arrow />
      {/* Output — same phone, brand-aware backdrop */}
      <MiniBox label="AFTER" tone="accent">
        <div className="relative w-full h-full overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--accent) 40%, #0A0A0A) 0%, #0A0A0A 70%)",
            }}
          />
          {/* Decorative line motif (vinyl-style) */}
          <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full opacity-50" aria-hidden>
            <circle cx="50" cy="50" r="20" fill="none" stroke="var(--accent)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="14" fill="none" stroke="var(--accent)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="8"  fill="none" stroke="var(--accent)" strokeWidth="0.5" />
          </svg>
          <MiniPhone screenColor="#3CC8FF" />
        </div>
      </MiniBox>
    </div>
  );
}

function RestyleVisual() {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center" aria-hidden>
      {/* Input — reference photo (gradient swatch representing palette) */}
      <MiniBox label="REF PHOTO" tone="mute">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #1B3A2F 0%, #E74C3C 50%, #F5F0E1 100%)",
          }}
        />
        {/* Tiny "📷" indicator */}
        <span className="absolute bottom-0.5 right-0.5 t-mono-xs text-white/80 text-[7px]">
          REF
        </span>
      </MiniBox>
      <Arrow />
      {/* Output — pack restyled to match */}
      <MiniBox label="RESTYLED" tone="accent">
        <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-1">
          {/* Three mini cards in restyled palette */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex-1 h-3/4 border border-white/15"
              style={{
                background: i === 0 ? "#1B3A2F" : i === 1 ? "#E74C3C" : "#F5F0E1",
              }}
            />
          ))}
        </div>
      </MiniBox>
    </div>
  );
}

// ── Primitives ───────────────────────────────────────────────────────────────

function MiniBox({
  label,
  tone,
  children,
}: {
  label:    string;
  tone:     "mute" | "accent";
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <div className="t-mono-xs text-[8px] uppercase tracking-[0.16em] mb-1.5 truncate"
           style={{ color: tone === "accent" ? "var(--accent)" : "var(--fg-mute)" }}>
        {label}
      </div>
      <div
        className={`relative aspect-[5/4] border bg-[var(--bg-2)] overflow-hidden flex items-center justify-center p-1.5 ${
          tone === "accent" ? "border-[var(--accent)]" : "border-[var(--line-strong)]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="square"
         className="text-[var(--accent)] mt-4" aria-hidden>
      <path d="M4 12 L20 12" />
      <path d="M14 6 L20 12 L14 18" />
    </svg>
  );
}

function MiniPhone({ screenColor }: { screenColor: string }) {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 bottom-[8%] w-[40%] h-[78%] rounded-[3px] border border-white/30 bg-black overflow-hidden"
      aria-hidden
    >
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[30%] h-[5%] bg-black rounded-full z-10" />
      <div className="absolute inset-[8%] top-[10%] rounded-[2px]" style={{ background: screenColor, opacity: 0.85 }} />
    </div>
  );
}

// ── Row 2 visuals ────────────────────────────────────────────────────────────

function LocalesVisual() {
  // Eight locale chips — same monospace treatment, accent on EN as the "source"
  const LOCALES = ["EN", "FR", "DE", "ES", "JA", "ZH", "AR", "PT"];
  return (
    <div className="flex flex-wrap gap-1" aria-hidden>
      {LOCALES.map((l) => (
        <span
          key={l}
          className={`inline-flex items-center justify-center px-1.5 py-0.5 t-mono-xs uppercase tracking-[0.12em] border ${
            l === "EN"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-[var(--line-strong)] text-[var(--fg-mute)]"
          }`}
        >
          {l}
        </span>
      ))}
      <span className="inline-flex items-center justify-center px-1.5 py-0.5 t-mono-xs uppercase tracking-[0.12em] border border-[var(--line)] text-[var(--fg-mute)]">
        +33
      </span>
    </div>
  );
}

function DevicesVisual() {
  // Three device silhouettes — iPhone 6.9", iPhone 6.7", iPad 13" — to scale
  return (
    <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-3 items-end h-[60px]" aria-hidden>
      {/* iPhone 6.9 — tallest portrait */}
      <DeviceSilhouette label="6.9″" tone="accent" aspect="9/19.5" />
      {/* iPhone 6.7 — slightly shorter */}
      <DeviceSilhouette label="6.7″" tone="default" aspect="9/19" />
      {/* iPad 13 — landscape proportions, wider */}
      <DeviceSilhouette label="13″" tone="default" aspect="13/9" wide />
    </div>
  );
}

function DeviceSilhouette({
  label, tone, aspect, wide = false,
}: {
  label:  string;
  tone:   "default" | "accent";
  aspect: string;
  wide?:  boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 h-full justify-end">
      <div
        className={`relative border bg-[var(--bg-2)] overflow-hidden ${wide ? "w-full h-[55%]" : "w-[55%] h-full"} ${
          tone === "accent" ? "border-[var(--accent)]" : "border-[var(--line-strong)]"
        }`}
        style={{ aspectRatio: aspect }}
      >
        {/* Dynamic island / camera bar */}
        {!wide && (
          <span
            className="absolute left-1/2 -translate-x-1/2 top-[6%] block bg-black rounded-full"
            style={{ width: "30%", height: "4%" }}
            aria-hidden
          />
        )}
        {wide && (
          <span
            className="absolute right-[6%] top-1/2 -translate-y-1/2 block bg-black rounded-full"
            style={{ width: "3%", height: "8%" }}
            aria-hidden
          />
        )}
      </div>
      <span className={`t-mono-xs text-[8px] uppercase tracking-[0.12em] ${
        tone === "accent" ? "text-[var(--accent)]" : "text-[var(--fg-mute)]"
      }`}>
        {label}
      </span>
    </div>
  );
}

function UploadVisual() {
  // Project asset → upload arrow → App Store icon
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center" aria-hidden>
      {/* Source: project ZIP / pack */}
      <MiniBox label="PACK" tone="mute">
        <div className="absolute inset-1 grid grid-cols-3 gap-px">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-[var(--fg-dim)] opacity-50" />
          ))}
        </div>
        <span className="absolute bottom-0.5 right-0.5 t-mono-xs text-[7px] text-[var(--fg-mute)]">.zip</span>
      </MiniBox>
      {/* Upload arrow with cloud */}
      <div className="flex flex-col items-center gap-0.5 mt-4">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="square"
             className="text-[var(--accent)]" aria-hidden>
          <path d="M12 4 L12 14" />
          <path d="M7 9 L12 4 L17 9" />
          <path d="M4 18 L20 18" />
        </svg>
        <span className="t-mono-xs text-[7px] text-[var(--accent)] uppercase tracking-[0.16em]">PUSH</span>
      </div>
      {/* Target: App Store Connect */}
      <MiniBox label="ASC" tone="accent">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Stylized App Store "A" icon */}
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--accent)] via-[#FF6B6B] to-[#FF2A2A] flex items-center justify-center text-white text-[12px] font-bold leading-none">
            A
          </div>
        </div>
      </MiniBox>
    </div>
  );
}
