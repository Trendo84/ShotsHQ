const FEATURES = [
  {
    code: "01",
    title: "AI copy",
    body: "GPT-5 with Zod schemas. Headline, subheadline, CTA — fixed-length, never malformed.",
    spec: "1 cr / gen",
  },
  {
    code: "02",
    title: "Backdrops",
    body: "Lift the subject with birefnet, regenerate the background with Flux 2, composite at full fidelity.",
    spec: "2 cr / gen",
  },
  {
    code: "03",
    title: "Restyle",
    body: "Drop in a reference shot. The model lifts the palette, mood, and light, then re-skins the whole pack.",
    spec: "3 cr / gen",
  },
  {
    code: "04",
    title: "41 locales",
    body: "Fan-out in parallel. RTL and CJK auto-relayout, glyph-aware kerning, no clipped text.",
    spec: "1 cr / loc",
  },
  {
    code: "05",
    title: "Device frames",
    body: "iPhone 6.9″ / 6.7″ / iPad 13″ M4. Crisp masters, dynamic-island accurate, every safe area honoured.",
    spec: "Free",
  },
  {
    code: "06",
    title: "Direct upload",
    body: "Push generated assets to App Store Connect. Per-locale, per-device, zero filename gymnastics.",
    spec: "Free",
  },
];

export function FeatureGrid() {
  return (
    <section className="border-b border-[var(--line)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-8 mb-14 items-end">
          <h2 className="col-span-12 md:col-span-7 t-display text-[clamp(2rem,5.5vw,4.5rem)] leading-[0.95] text-balance">
            Six modules.<br />
            No junk drawer.
          </h2>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md">
            Each module deploys independently, bills independently, refunds on
            failure. Studio subscribers skip the meter entirely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)]">
          {FEATURES.map((f) => (
            <article key={f.code} className="bg-[var(--bg)] p-7 min-h-[240px] flex flex-col">
              <header className="flex items-start justify-between mb-5">
                <span className="t-eyebrow t-numeric">{f.code}</span>
                <span className="t-eyebrow text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[var(--accent)] px-1.5 py-0.5 normal-case tracking-[0.05em]">
                  {f.spec}
                </span>
              </header>
              <h3 className="t-display text-[clamp(1.75rem,3vw,2rem)] leading-[0.95] mb-3">{f.title}</h3>
              <p className="t-prose text-[14px]">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
