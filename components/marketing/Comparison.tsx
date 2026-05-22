import Image from "next/image";
import { Check, Minus } from "lucide-react";
import { Reveal } from "@/components/Reveal";

type Cell = string | "yes" | "no";

// Row order leads with sale-closers per UX audit pass 2 (P1 #4):
// refunds-on-failure first, ASC upload second, locales pushed to row 3.
// These three are the genuinely uncopyable features incumbents can't ship
// without rebuilding their billing + integration layer.
const ROWS: Array<{ label: string; shots: Cell; others: Cell }> = [
  { label: "Refunds credits on AI failure",          shots: "Automatic",         others: "Manual support ticket" },
  { label: "Direct App Store Connect upload",        shots: "yes",               others: "no" },
  { label: "Locales supported",                      shots: "41",                others: "6 (avg.)" },
  { label: "AI headline copy",                       shots: "Frontier LLM",      others: "Manual" },
  { label: "AI background generation",               shots: "Best-in-class image model", others: "Stock only" },
  { label: "Device frames (6.9″ / 6.7″ / iPad 13″)", shots: "yes",               others: "Partial" },
  { label: "Free tier exports",                      shots: "Watermarked",       others: "Watermarked or paywalled" },
  { label: "Project versioning",                     shots: "Cloud (Postgres)",  others: "Browser only" },
  { label: "Pricing model",                          shots: "Credits + Studio plan", others: "Monthly only" },
];

function Value({ v, accent }: { v: Cell; accent?: boolean }) {
  if (v === "yes")
    return (
      <span className={`inline-flex items-center gap-1.5 ${accent ? "text-[var(--signal)]" : "text-[var(--fg)]"}`}>
        <Check size={14} strokeWidth={2.5} />
        <span className="text-[14px]">Yes</span>
      </span>
    );
  if (v === "no")
    return (
      <span className="inline-flex items-center gap-1.5 text-[var(--fg-mute)]">
        <Minus size={14} />
        <span className="text-[14px]">No</span>
      </span>
    );
  return (
    <span className={`text-[14px] ${accent ? "text-[var(--fg)] font-medium" : "text-[var(--fg-mute)]"}`}>
      {v}
    </span>
  );
}

export function Comparison() {
  return (
    <section className="border-b border-[var(--line)] bg-[var(--bg)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">

        {/* Pattern-break: single-column header, no kicker, no right-column
            description. Utility section — opens with the H2 directly,
            small inline subtitle, table below. Breaks the kicker → H2 →
            right-column rhythm of the surrounding sections. */}
        <Reveal as="div" className="flex items-end gap-4 md:gap-6 min-w-0 mb-3">
          <Image
            src="/comparison-trophy.png"
            alt=""
            aria-hidden="true"
            width={120}
            height={120}
            className="hidden sm:block w-[72px] h-[72px] md:w-[96px] md:h-[96px] shrink-0 select-none comparison-trophy"
            draggable={false}
          />
          <h2 className="t-display t-h-3 min-w-0">
            Keep the polish of templates without getting trapped in a generic design canvas.
          </h2>
        </Reveal>
        <p className="t-mono-sm text-[var(--fg-mute)] mb-10 max-w-2xl">
          Built for launch-ready App Store assets, localized variants, and promo surfaces — not generic canvas work.
        </p>

        <div className="border border-[var(--line)] max-w-full md:max-w-4xl overflow-x-auto">
          <div className="grid grid-cols-[1fr_92px_92px] sm:grid-cols-[1fr_140px_140px] md:grid-cols-[1fr_180px_180px] border-b border-[var(--line)] bg-[var(--bg-2)]">
            <div className="p-3 t-eyebrow">Capability</div>
            <div className="p-3 t-eyebrow text-[var(--accent)] text-right">ShotsHQ</div>
            <div className="p-3 t-eyebrow text-right">Others</div>
          </div>
          {ROWS.map((r) => (
            <div
              key={r.label}
              className="grid grid-cols-[1fr_92px_92px] sm:grid-cols-[1fr_140px_140px] md:grid-cols-[1fr_180px_180px] border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--bg-2)]/50 transition-colors"
            >
              <div className="p-3 sm:p-4 text-[13px] sm:text-[14px] text-[var(--fg)] break-words min-w-0">{r.label}</div>
              <div className="p-3 sm:p-4 text-right">
                <Value v={r.shots} accent />
              </div>
              <div className="p-3 sm:p-4 text-right">
                <Value v={r.others} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
