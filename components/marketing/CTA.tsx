import Link from "next/link";
import { AppCta } from "@/components/marketing/AppCta";

const PLANS = [
  { id: "free",     label: "Free",         price: "$0",   note: "unlimited editor",   accent: false },
  { id: "indie",    label: "Indie pack",   price: "$19",  note: "100 cr · don't expire", accent: false },
  { id: "pro",      label: "Pro pack",     price: "$49",  note: "300 cr · best value", accent: true  },
  { id: "studio",   label: "Studio",       price: "$29 / mo", note: "unmetered AI",   accent: false },
];

export function CTA() {
  return (
    <section className="relative overflow-hidden border-t border-[var(--line)] bg-[var(--bg-2)]">
      <div className="relative z-10 max-w-[1480px] mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-12 gap-8 items-end">

          {/* Headline — varied cadence (no period-period) per UX audit P2 #7.
              Tier-1 size matches the hero H1 — these two anchor the page. */}
          <h2 className="col-span-12 md:col-span-7 t-display t-h-1 text-balance">
            The next time you ship,
            <br />
            <span className="text-[var(--accent)]">do the screenshots last.</span>
          </h2>

          {/* Right column — full plan set + CTA + reassurance */}
          <div className="col-span-12 md:col-span-5 flex flex-col gap-5">
            <ul className="grid grid-cols-2 gap-px bg-[var(--line)] border border-[var(--line)]">
              {PLANS.map((p) => (
                <li
                  key={p.id}
                  className={`bg-[var(--bg)] p-4 ${
                    p.accent ? "shadow-[inset_0_-2px_0_var(--accent)]" : ""
                  }`}
                >
                  <div
                    className={`t-mono-xs mb-1 uppercase tracking-[0.16em] ${
                      p.accent ? "text-[var(--accent)]" : "text-[var(--fg-mute)]"
                    }`}
                  >
                    {p.label}
                  </div>
                  <div className="t-display text-[clamp(1.25rem,2.5vw,1.75rem)] leading-none t-numeric">
                    {p.price}
                  </div>
                  <div className="t-mono-xs text-[var(--fg-mute)] mt-2 truncate">
                    {p.note}
                  </div>
                </li>
              ))}
            </ul>

            <p className="t-prose max-w-sm">
              Start free. Upgrade when you want clean exports, more credits, or Studio.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <AppCta
                dataCtaTag="landing-final-primary"
                signedOut={{ href: "/sign-up",      label: "Start free"        }}
                signedIn={{  href: "/projects/new", label: "Start a new project" }}
              />
              <Link
                href="/pricing"
                className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)]"
              >
                See full pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="hazard h-2" aria-hidden />
    </section>
  );
}
