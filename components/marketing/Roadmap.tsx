/**
 * Roadmap band — what's shipping next, with status. Each item is a real
 * commitment (we use it as the work order) so this also doubles as
 * a public TODO: ship it, flip status to Live, move on.
 *
 * Statuses:
 *   In dev → currently in progress
 *   Q3     → planned, on the queue
 *   Backlog → wanted, not scheduled
 */

type Status = "In dev" | "Q3" | "Backlog";

type Item = {
  id: string;
  title: string;
  blurb: string;
  status: Status;
};

const ROADMAP: Item[] = [
  {
    id: "ab-locales",
    title: "A/B headline variants per locale",
    blurb:
      "Two headlines per language, A/B baked into the export bundle. Lightweight AI call, big perceived value.",
    status: "In dev",
  },
  {
    id: "score-copy",
    title: "Conversion-graded copy",
    blurb:
      "Score every candidate against top-charting headline patterns: length, verb-first, benefit clarity. Recommend the best.",
    status: "In dev",
  },
  {
    id: "before-after",
    title: "One-tap before/after share image",
    blurb:
      "Single render showing raw screen vs ShotsHQ output. Tweetable, drives signups, costs you nothing.",
    status: "Q3",
  },
  {
    id: "theme-pairs",
    title: "Dark/light mode pairs",
    blurb:
      "One project, both themes rendered, toggled live in the editor. Apple now recommends submitting both.",
    status: "Q3",
  },
  {
    id: "brand-memory",
    title: "Brand-kit memory",
    blurb:
      "Extract palette + typography from your icon once. Every new project inherits the kit automatically.",
    status: "Q3",
  },
  {
    id: "glyph-qa",
    title: "Per-locale glyph QA",
    blurb:
      "Visual diff every translated layout. Flags clipped, stretched, or RTL-broken strings before export.",
    status: "Backlog",
  },
];

export function Roadmap() {
  return (
    <section className="border-b border-[var(--line)] bg-[var(--bg-2)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">
        <div className="grid grid-cols-12 gap-8 mb-12 items-end">
          <div className="col-span-12 md:col-span-7">
            <div className="t-eyebrow t-eyebrow-accent mb-3">Roadmap · Public</div>
            <h2 className="t-display text-[clamp(2rem,5vw,4rem)] leading-[0.95] text-balance">
              What's<br />
              <span className="text-[var(--accent)]">shipping next.</span>
            </h2>
          </div>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md">
            We ship in the open. Every item below is on the work order —
            statuses flip live as features move from <em>In dev</em> to{" "}
            <em>Live</em>. Bug us in <a className="link-tick" href="mailto:roadmap@shotshq.app">roadmap@shotshq.app</a> if a missing item should jump the queue.
          </p>
        </div>

        <ol className="border border-[var(--line)] bg-[var(--bg)]">
          {ROADMAP.map((item, i) => (
            <li
              key={item.id}
              className="grid grid-cols-12 gap-3 md:gap-6 px-5 md:px-7 py-5 md:py-6 border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--bg-2)]/60 transition-colors"
            >
              <div className="col-span-2 md:col-span-1 t-eyebrow t-numeric text-[var(--fg-mute)]">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="col-span-10 md:col-span-7 min-w-0">
                <h3 className="t-display text-[20px] md:text-[24px] leading-[0.98] tracking-[-0.02em] normal-case mb-1.5 break-words">
                  {item.title}
                </h3>
                <p className="t-prose text-[13px] md:text-[14px] leading-snug max-w-2xl">
                  {item.blurb}
                </p>
              </div>
              <div className="col-span-12 md:col-span-4 flex md:justify-end items-start mt-1 md:mt-0">
                <RoadmapStatus status={item.status} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function RoadmapStatus({ status }: { status: Status }) {
  const cfg: Record<Status, { fg: string; bg: string; border: string; label: string; pulse: boolean }> = {
    "In dev":   { fg: "var(--accent-fg)", bg: "var(--accent)",   border: "var(--accent)",       label: "In dev",  pulse: true  },
    "Q3":       { fg: "var(--fg)",        bg: "transparent",     border: "var(--line-strong)",  label: "Q3 2026", pulse: false },
    "Backlog":  { fg: "var(--fg-mute)",   bg: "transparent",     border: "var(--line)",         label: "Backlog", pulse: false },
  };
  const c = cfg[status];
  return (
    <span
      className="inline-flex items-center gap-2 px-2.5 py-1.5 t-mono-xs uppercase tracking-[0.14em] font-semibold"
      style={{ background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}
    >
      {c.pulse ? (
        <span className="relative flex w-1.5 h-1.5">
          <span
            className="absolute inset-0 animate-ping"
            style={{ background: "currentColor", opacity: 0.65 }}
          />
          <span className="relative w-1.5 h-1.5" style={{ background: "currentColor" }} />
        </span>
      ) : (
        <span className="block w-1.5 h-1.5" style={{ background: "currentColor" }} />
      )}
      {c.label}
    </span>
  );
}
