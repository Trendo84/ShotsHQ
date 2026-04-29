import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Every release, dated and signed. No vague 'bug fixes and improvements.'",
};

const ENTRIES: Array<{
  rev: string;
  date: string;
  channel: "STABLE" | "BETA" | "INTERNAL";
  note?:   string;
  changes: { tag: string; body: string }[];
}> = [
  {
    rev: "REV 2.6",
    date: "2026-04-25",
    channel: "STABLE",
    changes: [
      { tag: "ADD",   body: "Structured AI headline schema with CTA suggestion field." },
      { tag: "ADD",   body: "Brand-extraction endpoint — paste any URL, get a brand profile that drives AI output." },
      { tag: "FIX",   body: "Editor autosave debounce raised to 500ms; prior 200ms thrashed the database." },
      { tag: "FIX",   body: "Billing meter idempotency now reuses ledger key — replay-safe." },
    ],
  },
  {
    rev: "REV 2.5",
    date: "2026-04-11",
    channel: "STABLE",
    changes: [
      { tag: "ADD",   body: "Direct upload to App Store Connect via JWT-signed API." },
      { tag: "ADD",   body: "iPad 13″ M4 master frame asset (2064 × 2752)." },
      { tag: "PERF",  body: "Server render pipeline now streams to storage; p50 dropped from 4.8s to 3.2s." },
    ],
  },
  {
    rev: "REV 2.4",
    date: "2026-03-28",
    channel: "STABLE",
    changes: [
      { tag: "ADD",   body: "AI background regeneration with subject lift and brand-aware palette." },
      { tag: "ADD",   body: "41-locale fan-out via parallel batch processing." },
      { tag: "FIX",   body: "Arabic / Hebrew layouts now mirror correctly across all device frames." },
    ],
  },
  {
    rev: "REV 2.3",
    date: "2026-03-14",
    channel: "BETA",
    changes: [
      { tag: "ADD",   body: "Studio Monthly subscription with metered usage." },
      { tag: "ADD",   body: "Public beta opened on Product Hunt + Indie Hackers." },
      { tag: "REM",   body: "Removed deprecated billing calls; meter events only." },
    ],
  },
  {
    rev: "REV 2.0",
    date: "2026-02-28",
    channel: "INTERNAL",
    note:    "REV 2.1 and 2.2 were internal-only iterations and not published.",
    changes: [
      { tag: "ADD",   body: "Canvas editor integrated; canvas state persisted to JSONB." },
      { tag: "ADD",   body: "Credit ledger system with idempotency-keyed transactions." },
    ],
  },
];

const TAG_COLORS: Record<string, string> = {
  ADD:  "text-[var(--signal)] border-[var(--signal)]",
  FIX:  "text-[var(--accent)] border-[var(--accent)]",
  PERF: "text-[var(--fg)] border-[var(--fg)]",
  REM:  "text-[var(--fg-mute)] border-[var(--fg-mute)]",
};

export default function ChangelogPage() {
  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">
          <div className="grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 md:col-span-7">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Release log</div>
              <h1 className="t-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.92]">
                Changelog.
              </h1>
            </div>
            <div className="col-span-12 md:col-span-5">
              <p className="t-prose-lg max-w-md">
                Every shipped revision, dated and categorized. No vague
                "bug fixes and improvements". New builds deploy every other
                Friday unless there's a fire.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1480px] mx-auto px-4 md:px-8 grid grid-cols-12 gap-10 py-12">
        <aside className="hidden lg:block col-span-3 sticky top-[88px] self-start">
          <div className="t-eyebrow mb-4">Index</div>
          <ul className="space-y-2.5 border-l border-[var(--line)] pl-4">
            {ENTRIES.map((e) => (
              <li key={e.rev} className="flex items-baseline justify-between gap-3">
                <a href={`#${e.rev.replace(/\s/g, "-")}`} className="text-[14px] text-[var(--fg)] hover:text-[var(--accent)] transition-colors">
                  {e.rev}
                </a>
                <span className="text-[12px] text-[var(--fg-mute)] t-numeric">{e.date}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="col-span-12 lg:col-span-9 space-y-16">
          {ENTRIES.map((entry) => (
            <article
              key={entry.rev}
              id={entry.rev.replace(/\s/g, "-")}
            >
              <header className="flex items-baseline justify-between flex-wrap gap-3 mb-6 pb-3 border-b border-[var(--line)]">
                <div className="flex items-baseline gap-4">
                  <h2 className="t-display text-[32px] leading-none normal-case tracking-[-0.02em]">{entry.rev}</h2>
                  <span className="text-[13px] text-[var(--fg-mute)] t-numeric">{entry.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="t-eyebrow">{entry.channel.toLowerCase()}</span>
                  <span className="flex items-center gap-1.5 text-[12px] text-[var(--signal)]">
                    <span className="block w-1.5 h-1.5 rounded-full bg-[var(--signal)]" />
                    deployed
                  </span>
                </div>
              </header>
              {entry.note && (
                <p className="t-mono-xs text-[var(--fg-mute)] mb-4 italic border-l-2 border-[var(--line-strong)] pl-3">
                  ▸ {entry.note}
                </p>
              )}
              <ul className="space-y-2.5">
                {entry.changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`inline-block min-w-[42px] text-center text-[10px] font-semibold tracking-[0.08em] uppercase border px-1.5 py-0.5 mt-0.5 ${TAG_COLORS[c.tag] ?? ""}`}>
                      {c.tag.toLowerCase()}
                    </span>
                    <span className="text-[14.5px] text-[var(--fg-dim)] leading-relaxed">{c.body}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
