const METRICS = [
  { value: "21", label: "Templates ready", sub: "starting points you can remix" },
  { value: "41", label: "Locales supported", sub: "parallel export fan-out" },
  { value: "3", label: "Apple size classes", sub: "6.9″ · 6.7″ · iPad 13″" },
  { value: "7", label: "Pipeline stages", sub: "from intake to export" },
];

/**
 * Honest proof band.
 *
 * The previous values were flashy but unverified. The homepage should not fake
 * operational or adoption metrics, so this band now uses facts that are true
 * from the product itself and visible elsewhere on the page.
 */
export function MetricsBand() {
  return (
    <section className="border-b border-[var(--line)] bg-[var(--bg)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-10 md:py-12">
        <div className="grid grid-cols-12 gap-6 md:gap-8 items-end mb-8">
          <div className="col-span-12 md:col-span-7">
            <div className="t-eyebrow t-eyebrow-accent mb-3">At a glance</div>
            <h2 className="t-display text-[clamp(1.5rem,3.2vw,2.5rem)] leading-[0.95] tracking-[-0.03em] normal-case text-balance">
              The shape of the product, before you keep scrolling.
            </h2>
          </div>
          <p className="col-span-12 md:col-span-5 t-prose text-[14px] max-w-md">
            No vanity metrics here — just the constraints and capabilities that define what ShotsHQ actually does today.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)]">
          {METRICS.map((m) => (
            <div key={m.label} className="bg-[var(--bg-2)] p-5 md:p-6">
              <div className="t-display text-[clamp(2.2rem,5vw,3.75rem)] leading-[0.9] tracking-[-0.05em] t-numeric text-[var(--accent)]">
                {m.value}
              </div>
              <div className="mt-3 t-eyebrow text-[var(--fg)]">{m.label}</div>
              <div className="t-eyebrow text-[var(--fg-mute)] mt-1 normal-case tracking-[0.04em]">
                {m.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
