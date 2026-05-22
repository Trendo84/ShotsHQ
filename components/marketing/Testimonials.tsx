import Link from "next/link";
import { GitCommit, Calendar, Github } from "lucide-react";
import { Reveal } from "@/components/Reveal";

/**
 * "Built in the open" panel — replaces the previous testimonials
 * grid which used named-but-fabricated quotes. Per UX audit pass 2
 * (P1 #3): naming fake people + admitting they're fake reads worse
 * than no testimonials at all. The build-in-public angle is itself
 * the social proof at this stage; surface it directly.
 *
 * Component is exported with the original `Testimonials` name so the
 * homepage import doesn't churn — the rendered intent is just the
 * honest version.
 */

type Signal = {
  label:    string;
  value:    string;
  hint:     string;
  href:     string;
  icon:     React.ReactNode;
};

const SIGNALS: Signal[] = [
  {
    label: "Changelog",
    value: "v2.6",
    hint:  "Shipped this month",
    href:  "/changelog",
    icon:  <GitCommit size={14} />,
  },
  {
    label: "Roadmap",
    value: "Open",
    hint:  "Vote on what ships next",
    href:  "/changelog#roadmap",
    icon:  <Calendar size={14} />,
  },
  {
    label: "Source",
    value: "Public",
    hint:  "Issues, discussions",
    href:  "https://github.com/Trendo84/ShotsHQ",
    icon:  <Github size={14} />,
  },
];

export function Testimonials() {
  return (
    <section className="border-b border-[var(--line)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">
        <Reveal as="div" className="grid grid-cols-12 gap-8 mb-10 items-end">
          <div className="col-span-12 md:col-span-7">
            <div className="t-eyebrow t-eyebrow-accent mb-3">Built in the open</div>
            <h2 className="t-display text-[clamp(2rem,5vw,4rem)] leading-[0.95] text-balance">
              You can watch this one get built.
            </h2>
          </div>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md">
            ShotsHQ is a solo studio shipping in public. Every release,
            every architectural call, every credit-ledger refund rule
            is documented and reachable from this site.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)]">
          {SIGNALS.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 70}
              y={16}
              className="bg-[var(--bg)]"
            >
              <Link
                href={s.href}
                className="group h-full p-7 min-h-[180px] flex flex-col justify-between hover:bg-[var(--bg-2)] transition-colors focus-visible:outline-none focus-visible:bg-[var(--bg-2)] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
              >
                <header className="flex items-center justify-between gap-3">
                  <span className="t-eyebrow t-eyebrow-accent">{s.label}</span>
                  <span className="text-[var(--fg-mute)] group-hover:text-[var(--accent)] transition-colors">
                    {s.icon}
                  </span>
                </header>
                <div>
                  <div className="t-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[0.95] mt-3">
                    {s.value}
                  </div>
                  <p className="t-mono-xs text-[var(--fg-mute)] mt-2 uppercase tracking-[0.14em]">
                    {s.hint}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="t-mono-xs text-[var(--fg-mute)] group-hover:text-[var(--accent)] transition-colors mt-4 block"
                >
                  Open →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <p className="t-mono-xs text-[var(--fg-mute)] mt-8 max-w-2xl leading-relaxed">
          Real testimonials land here once we&apos;ve shipped to a
          critical mass of indie iOS devs. We&apos;d rather wait for
          the real thing than ship fake quotes.
        </p>
      </div>
    </section>
  );
}
