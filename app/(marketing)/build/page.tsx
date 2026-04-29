import type { Metadata } from "next";
import Link from "next/link";
import {
  PHASES,
  LAST_UPDATED,
  PROD_URL,
  REPO_URL,
  pctComplete,
  totalCounts,
  totalSteps,
  countByStatus,
  type Status,
  type Step,
} from "@/lib/build/status";

export const metadata: Metadata = {
  title:       "Build Status — ShotsHQ",
  description: "Live tracker of every step from infra to launch. Updated as work lands.",
  robots:      { index: false, follow: false }, // private build doc
};

const STATUS_LABEL: Record<Status, string> = {
  done:         "DONE",
  in_progress:  "DOING",
  todo:         "TODO",
  blocked:      "BLOCKED",
};

const STATUS_GLYPH: Record<Status, string> = {
  done:         "●",
  in_progress:  "◐",
  todo:         "○",
  blocked:      "⊠",
};

const STATUS_CLASS: Record<Status, string> = {
  done:        "text-[var(--signal)] border-[var(--signal)]",
  in_progress: "text-[var(--accent)] border-[var(--accent)]",
  todo:        "text-[var(--fg-mute)] border-[var(--line)]",
  blocked:     "text-red-400 border-red-400",
};

export default function BuildPage() {
  const counts  = totalCounts();
  const total   = totalSteps();
  const percent = pctComplete();

  return (
    <main className="min-h-dvh bg-[var(--bg)]">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="border-b border-[var(--line)] bg-[var(--bg-2)]">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
          <div className="t-mono-xs text-[var(--accent)] mb-3">// BUILD STATUS · LIVE TRACKER</div>
          <h1 className="t-display text-[clamp(2.25rem,6vw,4rem)] leading-[0.92] mb-4">
            Every step.<br />
            <span className="text-[var(--accent)]">Every link.</span><br />
            Real-time.
          </h1>
          <p className="t-mono-sm text-[var(--fg-dim)] max-w-[60ch] leading-relaxed">
            One source of truth for what&apos;s shipped, what&apos;s mid-flight, and
            what&apos;s next. Updated as work lands. No bullshit, no roadmap-theater —
            just the actual file.
          </p>

          {/* Top stats */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
            <Stat label="DONE"       value={counts.done}        glyph="●" tone="signal" />
            <Stat label="DOING"      value={counts.in_progress} glyph="◐" tone="accent" />
            <Stat label="TODO"       value={counts.todo}        glyph="○" tone="mute"   />
            <Stat label="TOTAL"      value={total}              glyph="Σ" tone="fg"     />
          </div>

          {/* Progress bar */}
          <div className="mt-6 max-w-2xl">
            <div className="flex items-center justify-between t-mono-xs mb-2">
              <span className="text-[var(--fg-mute)]">OVERALL PROGRESS</span>
              <span className="text-[var(--fg)] tabular-nums">{percent}%</span>
            </div>
            <div className="h-2 bg-[var(--bg)] border border-[var(--line)]">
              <div
                className="h-full bg-[var(--accent)] transition-[width]"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-3 t-mono-xs text-[var(--fg-mute)]">
              Last updated: {LAST_UPDATED}
            </div>
          </div>

          {/* Quick links */}
          <div className="mt-8 flex flex-wrap gap-2 t-mono-xs">
            <a href={PROD_URL}        className="border border-[var(--line)] px-3 py-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">PROD ↗</a>
            <a href={REPO_URL}        className="border border-[var(--line)] px-3 py-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">REPO ↗</a>
            <a href="/api/health"     className="border border-[var(--line)] px-3 py-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">/api/health ↗</a>
            <a href="/sitemap.xml"    className="border border-[var(--line)] px-3 py-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">sitemap ↗</a>
            <Link href="/" className="border border-[var(--line)] px-3 py-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">← MARKETING</Link>
          </div>
        </div>
      </header>

      {/* ── Phases ───────────────────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-12 lg:py-16 space-y-16">
        {PHASES.map((phase) => {
          const c = countByStatus(phase);
          const phaseDone = c.done === phase.steps.length;
          const phaseDoing = c.in_progress > 0 || (c.done > 0 && c.todo > 0);

          return (
            <section key={phase.id} id={phase.id} className="scroll-mt-24">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="t-mono-xs text-[var(--accent)] tabular-nums">
                  {phase.number}
                </span>
                <h2 className="t-display text-[clamp(1.5rem,3.5vw,2.25rem)] leading-tight">
                  {phase.title}
                </h2>
                <span
                  className={`ml-auto t-mono-xs px-2 py-0.5 border ${
                    phaseDone
                      ? "text-[var(--signal)] border-[var(--signal)]"
                      : phaseDoing
                      ? "text-[var(--accent)] border-[var(--accent)]"
                      : "text-[var(--fg-mute)] border-[var(--line)]"
                  }`}
                >
                  {c.done}/{phase.steps.length}
                </span>
              </div>
              <p className="t-mono-sm text-[var(--fg-dim)] mb-6 ml-10">
                {phase.subtitle}
              </p>

              <div className="border border-[var(--line)] divide-y divide-[var(--line)]">
                {phase.steps.map((step) => (
                  <StepRow key={step.id} step={step} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--line)] bg-[var(--bg-2)] mt-16">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-8 t-mono-xs text-[var(--fg-mute)] flex flex-wrap items-center justify-between gap-3">
          <span>// shotshq · build dashboard · noindex</span>
          <span>file: <code className="text-[var(--fg-dim)]">lib/build/status.ts</code></span>
        </div>
      </footer>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Stat({
  label, value, glyph, tone,
}: {
  label: string;
  value: number;
  glyph: string;
  tone:  "signal" | "accent" | "mute" | "fg";
}) {
  const toneClass =
    tone === "signal" ? "text-[var(--signal)]" :
    tone === "accent" ? "text-[var(--accent)]" :
    tone === "mute"   ? "text-[var(--fg-mute)]" :
                        "text-[var(--fg)]";
  return (
    <div className="border border-[var(--line)] p-3">
      <div className={`t-mono-xs ${toneClass} mb-1`}>
        {glyph} {label}
      </div>
      <div className="t-display text-[clamp(1.5rem,4vw,2.25rem)] leading-none tabular-nums">
        {value}
      </div>
    </div>
  );
}

function StepRow({ step }: { step: Step }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4 p-4 lg:p-5">
      {/* Status pill */}
      <div className="pt-0.5">
        <span
          className={`inline-flex items-center gap-1.5 t-mono-xs border px-2 py-0.5 ${STATUS_CLASS[step.status]}`}
          title={STATUS_LABEL[step.status]}
        >
          <span aria-hidden>{STATUS_GLYPH[step.status]}</span>
          {STATUS_LABEL[step.status]}
        </span>
      </div>

      {/* Body */}
      <div className="min-w-0">
        <h3 className={`text-[15px] font-medium leading-snug ${
          step.status === "done" ? "text-[var(--fg-dim)]" : "text-[var(--fg)]"
        }`}>
          {step.title}
        </h3>

        {step.description && (
          <p className="t-mono-sm text-[var(--fg-dim)] mt-1.5 leading-relaxed">
            {step.description}
          </p>
        )}

        {step.notes && (
          <p className="t-mono-xs text-[var(--accent)] mt-2 leading-relaxed border-l-2 border-[var(--accent)] pl-2.5">
            ⚠ {step.notes}
          </p>
        )}

        {step.links && step.links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {step.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="t-mono-xs border border-[var(--line)] px-2 py-0.5 text-[var(--fg-dim)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
