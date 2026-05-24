import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppCta } from "@/components/marketing/AppCta";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free tier, credit packs, and Studio subscription. No subscription traps.",
};

/**
 * Pricing — decision-first composition. Structural redesign 2026-05-24.
 *
 * Was: 3-lane buyer-framing grid + a 5-card pricing matrix + an FAQ
 * block + a credit-reference table. Four equal-weight beats that
 * each said "look at me." The user could scan all 5 plans before
 * being told what kind of buyer they are.
 *
 * Now: the page leads with TWO branches — "Launching once or twice" vs
 * "Launching every cycle." Pick a branch, see the one plan that
 * fits. The legacy 5-card matrix is collapsed into a single
 * `<details>` reference block below the fold for the buyer who
 * already knows what they want. Credit costs + FAQ both collapse
 * into the same reference block (still browsable, just no longer
 * the dominant content of the page).
 *
 * The page now answers "which plan should I buy?" before it
 * answers "what are all the plans?"
 */

type Branch = {
  id:        "launches" | "ongoing";
  eyebrow:   string;
  question:  string;
  recommended: {
    name:    string;
    price:   string;
    cadence: string;
    pitch:   string;
    perks:   string[];
    signedOut: { href: string; label: string };
    signedIn:  { href: string; label: string };
  };
  alt: { name: string; price: string; href: string };
};

const BRANCHES: Branch[] = [
  {
    id:        "launches",
    eyebrow:   "Branch 01",
    question:  "Shipping a launch this month?",
    recommended: {
      name:    "Pro pack",
      price:   "$49",
      cadence: "one-off, never expires",
      pitch:   "300 credits — roughly 20–25 App Store packs. Pay once, ship as many launches as you want, walk away when you're done.",
      perks: [
        "20–25 complete launch packs",
        "Watermark removed",
        "Cloud project storage",
        "All required dimensions handled",
      ],
      signedOut: { href: "/sign-up?plan=pro", label: "Buy the Pro pack"  },
      signedIn:  { href: "/billing?plan=pro", label: "Buy in billing"    },
    },
    alt: { name: "Indie pack", price: "$19 / 100 cr", href: "/sign-up?plan=indie" },
  },
  {
    id:        "ongoing",
    eyebrow:   "Branch 02",
    question:  "Screenshots are part of your monthly cadence?",
    recommended: {
      name:    "Studio",
      price:   "$29",
      cadence: "per month, cancel from Stripe portal",
      pitch:   "Unmetered AI. Use as much copy, backdrop, restyle, and translate as you want — every month, no per-call billing.",
      perks: [
        "Unlimited AI generations",
        "All 41 locales + every device frame",
        "Cloud project storage",
        "Manage subscription via Stripe portal",
      ],
      signedOut: { href: "/sign-up?plan=studio", label: "Start Studio"        },
      signedIn:  { href: "/billing?plan=studio", label: "Upgrade in billing"  },
    },
    alt: { name: "Lifetime", price: "$149 once · 500 seats", href: "/sign-up?plan=lifetime" },
  },
];

/** Reference content under the disclosure — kept browsable but
 *  collapsed by default so it doesn't compete with the decision-first
 *  composition above. */
const REFERENCE = {
  costs: [
    { label: "AI copy generation",        cost: 1, body: "Headline, subheadline, CTA — guaranteed well-formed output." },
    { label: "AI backdrop · per frame",   cost: 2, body: "Flux 2 swaps the surrounding scene around your screenshot." },
    { label: "AI template set",           cost: 8, body: "gpt-image-1 generates a cohesive 6-frame carousel from your app metadata." },
    { label: "AI restyle from ref",       cost: 3, body: "Lift palette + mood from a reference, restyle the whole pack." },
    { label: "Translate · per locale",    cost: 1, body: "Auto-relayout, RTL-aware, parallel fan-out." },
    { label: "Export pack",               cost: 0, body: "Pixel-exact at App Store dimensions. ASC push is a v1.1 target." },
  ],
  faqs: [
    { q: "What counts as one full pack?", a: "A pack is a complete set of App Store screenshots for one app — typically 6 frames in one locale. At ~12–15 credits per pack (2 cr/backdrop × 6 + 1 cr copy), the Indie pack covers 6–8 packs and the Pro pack covers 20–25." },
    { q: "Can I buy credit packs on top of Studio?", a: "Yes. Studio includes unmetered AI for the subscriber, but credit packs stack onto your account if you want them." },
    { q: "What happens to my projects if I cancel Studio?", a: "Projects and previously-rendered exports stay accessible for 30 days post-cancellation, then archived (read-only) for 60 days, then deleted." },
    { q: "Free tier — really unlimited?", a: "Unlimited projects + editor time. Free exports include a small watermark in the corner. Any paid pack or Studio plan removes it." },
  ],
};

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-3">
            Pricing
          </div>
          <h1 className="text-balance text-[clamp(2.25rem,5vw,4rem)] font-semibold tracking-[-0.04em] leading-[1.02] text-[var(--fg)] max-w-3xl">
            One question picks your plan.
            <br />
            <span className="text-[var(--accent)]">Pick the one that matches how often you launch.</span>
          </h1>
        </div>
      </section>

      {/* Branching decision — two side-by-side recommended paths. */}
      <section className="border-b border-[var(--line)] bg-[var(--bg-2)]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {BRANCHES.map((b) => (
              <article
                key={b.id}
                data-pricing-branch={b.id}
                className="flex flex-col gap-5 rounded-[14px] border border-[var(--line)] bg-[var(--bg)] p-7 lg:p-8 hover:border-[var(--line-strong)] transition-colors"
              >
                <header>
                  <div className="text-[10.5px] uppercase tracking-[0.16em] text-[var(--fg-mute)] font-medium tabular-nums mb-2">
                    {b.eyebrow}
                  </div>
                  <h2 className="text-[clamp(1.25rem,2.4vw,1.625rem)] font-semibold tracking-[-0.015em] text-[var(--fg)] leading-snug">
                    {b.question}
                  </h2>
                </header>

                <div className="rounded-[10px] border border-[var(--accent)]/40 bg-[var(--bg-3)] p-5">
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium">
                      Recommended
                    </span>
                    <span className="text-[12px] text-[var(--fg-mute)]">{b.recommended.cadence}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-[28px] font-semibold tracking-[-0.025em] text-[var(--fg)]">
                      {b.recommended.name}
                    </span>
                    <span className="text-[20px] font-semibold tracking-[-0.025em] text-[var(--accent)] tabular-nums">
                      {b.recommended.price}
                    </span>
                  </div>
                  <p className="text-[13.5px] leading-[1.55] text-[var(--fg-dim)] mb-4">
                    {b.recommended.pitch}
                  </p>
                  <ul className="space-y-1.5 mb-5">
                    {b.recommended.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-[13px] text-[var(--fg)] leading-snug">
                        <span aria-hidden className="text-[var(--accent)] mt-0.5">▸</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                  <AppCta
                    dataCtaTag={`pricing-branch-${b.id}`}
                    signedOut={b.recommended.signedOut}
                    signedIn={b.recommended.signedIn}
                  />
                </div>

                <div className="text-[12.5px] text-[var(--fg-mute)] leading-relaxed">
                  Or pick the smaller option:{" "}
                  <Link
                    href={b.alt.href}
                    className="text-[var(--fg-dim)] hover:text-[var(--accent)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)]"
                  >
                    {b.alt.name} · {b.alt.price}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-10 text-[13px] text-[var(--fg-mute)] text-center">
            Just trying it out? The Free tier is unlimited — watermarked exports, no card.{" "}
            <Link href="/sign-up" className="text-[var(--fg-dim)] hover:text-[var(--accent)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)]">
              Start free →
            </Link>
          </p>
        </div>
      </section>

      {/* Reference — collapsed by default. Browsable for buyers who
         already know what they want; not the dominant page content. */}
      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-14 md:py-16">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--line)]">
                <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-[var(--fg)] leading-snug">
                  Reference — credit costs + FAQ
                </h2>
                <span className="text-[12px] text-[var(--fg-mute)] inline-flex items-center gap-1 group-open:rotate-90 transition-transform">
                  <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
                </span>
              </div>
            </summary>

            <div className="pt-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
              {/* Credit cost table */}
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-3">
                  Credit costs
                </div>
                <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                  {REFERENCE.costs.map((row) => (
                    <li key={row.label} className="py-3 grid grid-cols-[1fr_auto] gap-3 items-baseline">
                      <div className="min-w-0">
                        <div className="text-[14px] font-medium text-[var(--fg)] leading-snug">{row.label}</div>
                        <div className="text-[12.5px] text-[var(--fg-dim)] mt-1 leading-snug">{row.body}</div>
                      </div>
                      <span className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--accent)] tabular-nums shrink-0">
                        {row.cost === 0 ? "Free" : `${row.cost} cr`}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-[12.5px] text-[var(--fg-mute)] mt-3">
                  Studio subscribers skip credit costs entirely.
                </p>
              </div>

              {/* FAQ */}
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-3">
                  FAQ
                </div>
                <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                  {REFERENCE.faqs.map((f) => (
                    <li key={f.q} className="py-4">
                      <h3 className="text-[14px] font-medium text-[var(--fg)] leading-snug mb-2">{f.q}</h3>
                      <p className="text-[13px] leading-[1.6] text-[var(--fg-dim)]">{f.a}</p>
                    </li>
                  ))}
                </ul>
                <p className="text-[12.5px] text-[var(--fg-mute)] mt-3">
                  Full <Link href="/docs/billing" className="text-[var(--fg-dim)] hover:text-[var(--accent)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)]">billing docs</Link>{" "}
                  · email <a href="mailto:support@shotshq.com" className="text-[var(--fg-dim)] hover:text-[var(--accent)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)]">support@shotshq.com</a>.
                </p>
              </div>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}
