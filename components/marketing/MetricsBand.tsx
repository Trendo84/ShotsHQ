const METRICS = [
  { value: "1,402,884", label: "Screenshots rendered",  sub: "since Q1 2026" },
  { value: "41",        label: "Locales supported",     sub: "RTL + CJK ready" },
  { value: "3.2s",      label: "Median render P50",     sub: "fal.ai sustained" },
  { value: "$149",      label: "Lifetime tier",         sub: "first 500 seats" },
];

export function MetricsBand() {
  return (
    <section className="border-b border-[var(--line)] bg-[var(--bg-2)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {METRICS.map((m) => (
            <div key={m.label}>
              <div className="t-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.9] tracking-[-0.05em] t-numeric">
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
