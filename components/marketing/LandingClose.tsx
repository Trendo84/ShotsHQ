import { AppCta } from "@/components/marketing/AppCta";

/**
 * LandingClose — final landing moment. Structural redesign 2026-05-24.
 *
 * Replaces the FeatureGrid + CTA double-section at the bottom with a
 * single closer block. Two columns on desktop:
 *
 *   left  — closing pitch with a single accent line "Ship the
 *           screenshots last." and a primary CTA.
 *   right — three concrete launch-day promises pinned to real
 *           product behavior: refunds on failure, every dimension
 *           handled, every locale parallelised.
 *
 * The point: stop ending the page on a generic "module grid + CTA"
 * pattern. The user should leave the page with one clear next action
 * and a short, verifiable promise list — not a feature catalog.
 */

const PROMISES = [
  {
    label: "Failed AI runs refund",
    body:  "Every dispatch wraps a debit + AI call + meter event in one transaction. Any failure auto-refunds the credit.",
  },
  {
    label: "Every required dimension",
    body:  "1290×2796, 1320×2868, 2064×2752 — App Store-exact, no resampling, no drift. The server is authoritative.",
  },
  {
    label: "41 locales in parallel",
    body:  "Translate fans out across 41 locales. RTL + CJK auto-relayout. One failure refunds one credit, not the whole pack.",
  },
];

export function LandingClose() {
  return (
    <section className="border-t border-[var(--line)] bg-[var(--bg)]">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Closer pitch + CTA */}
          <div className="lg:col-span-7">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-3">
              Ready when you are
            </div>
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-[-0.035em] text-[var(--fg)] leading-[1.02] text-balance mb-6">
              The next time you ship,
              <br />
              <span className="text-[var(--accent)]">do the screenshots last.</span>
            </h2>
            <p className="text-[16px] leading-[1.6] text-[var(--fg-dim)] max-w-[52ch] mb-8">
              ShotsHQ replaces the design step. Drop in the screens
              when the app is otherwise done. Walk away with a
              shippable App Store pack.
            </p>
            <AppCta
              dataCtaTag="landing-close-primary"
              signedOut={{ href: "/sign-up",      label: "Start free"          }}
              signedIn={{  href: "/projects/new", label: "Start a new project" }}
            />
          </div>

          {/* Verifiable promises */}
          <div className="lg:col-span-5">
            <ol className="space-y-5 border-l border-[var(--line)] pl-6">
              {PROMISES.map((p, i) => (
                <li key={p.label} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[10.5px] uppercase tracking-[0.16em] text-[var(--accent)] font-medium tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--fg)] leading-snug">
                      {p.label}
                    </h3>
                  </div>
                  <p className="text-[13.5px] leading-[1.6] text-[var(--fg-dim)] max-w-[44ch]">
                    {p.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
