/**
 * LandingWorkflow — single coherent "how this works in practice"
 * narrative beat. Structural redesign 2026-05-24.
 *
 * Replaces the prior section-stack of PipelineDiagram + Surfaces +
 * FeatureGrid (three separate beats that each shouted "we have
 * MORE!") with ONE continuous row of four steps. Each step pins a
 * concrete user action against an outcome — never an abstract
 * module name. The row is the page's "how it works in practice"
 * moment; it should read in one motion, not as a grid of equal
 * cards to compare.
 */
const STEPS = [
  {
    n:       "01",
    label:   "Drop",
    title:   "Drop your raw screenshots",
    body:    "Drag in PNGs straight from Xcode or the simulator. ShotsHQ buckets each one by dimension into the right device slot.",
    accent:  "iPhone + iPad",
  },
  {
    n:       "02",
    label:   "Compose",
    title:   "Compose in Studio",
    body:    "Ordered panels — one per App Store screenshot. Pick a layout, write a headline, place the device frame. Reorder by drag.",
    accent:  "Ordered panels",
  },
  {
    n:       "03",
    label:   "Polish",
    title:   "Let the AI do the labour",
    body:    "Headlines, backdrops, palette restyles — all dispatched through Trigger.dev with automatic refunds on failure.",
    accent:  "5 modules",
  },
  {
    n:       "04",
    label:   "Ship",
    title:   "Ship the pack",
    body:    "Export at 1290×2796, 1320×2868, 2064×2752 — App Store-exact. Server render queue + direct ASC push land in v1.1.",
    accent:  "Pixel-exact",
  },
];

export function LandingWorkflow() {
  return (
    <section
      className="border-b border-[var(--line)] bg-[var(--bg-2)]"
      aria-label="Workflow"
    >
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="mb-12 max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-3">
            How it works in practice
          </div>
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.025em] text-[var(--fg)] leading-[1.05] text-balance">
            One source, four moves, a shippable launch pack.
          </h2>
        </div>

        {/* Four-step continuous row. On desktop it reads as a single
           horizontal motion; on tablet it stacks 2×2; on mobile it
           stacks 1-up. The connecting hairline between steps stays
           visible on desktop to reinforce continuity (vs four
           comparable cards). */}
        <ol className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] rounded-md overflow-hidden">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="bg-[var(--bg)] p-6 lg:p-7 flex flex-col gap-3 min-h-[220px] relative"
              data-workflow-step={s.n}
            >
              <header className="flex items-baseline justify-between gap-3">
                <span className="text-[10.5px] uppercase tracking-[0.16em] text-[var(--fg-mute)] font-medium tabular-nums">
                  {s.n}
                </span>
                <span className="text-[10.5px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium">
                  {s.accent}
                </span>
              </header>
              <h3 className="text-[18px] font-semibold tracking-[-0.015em] text-[var(--fg)] leading-snug">
                {s.title}
              </h3>
              <p className="text-[13.5px] leading-[1.55] text-[var(--fg-dim)] mt-auto">
                {s.body}
              </p>
              {/* Continuity arrow — desktop only, between steps. Sits
                 on the right divider line so the row reads as one
                 motion instead of four comparable cards. */}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="hidden lg:flex absolute right-[-9px] top-1/2 -translate-y-1/2 z-10 w-[18px] h-[18px] items-center justify-center rounded-full bg-[var(--bg-2)] border border-[var(--line)] text-[var(--fg-mute)]"
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                    <path d="M2 4.5 L7 4.5 M5 2 L7 4.5 L5 7" />
                  </svg>
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
