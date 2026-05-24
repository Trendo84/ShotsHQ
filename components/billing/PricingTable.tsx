import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  highlight?: boolean;
  flag?: string;
  cta: string;
  ctaHref: string;
  /** Core bullets — only what's live today. The buying scan path. */
  perks: string[];
  /** Optional secondary note for future-state perks. Renders muted
   *  beneath the live bullets — keeps the honesty without competing
   *  with the buying decision. */
  comingNext?: string;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "Try the workflow. Watermarked exports.",
    cta: "Start free",
    ctaHref: "/sign-up",
    perks: [
      "Unlimited project editor",
      "All device frames",
      "Cloud project storage",
      "Watermarked exports",
    ],
  },
  {
    id: "indie",
    name: "Indie pack",
    price: "$19",
    cadence: "one-off",
    description: "Pay per launch. 100 credits — roughly 6-8 full packs. Never expires.",
    cta: "Buy pack",
    ctaHref: "/sign-up?plan=indie",
    perks: [
      "100 credits, never expire",
      "6-8 full App Store packs",
      "Watermark removed",
      "Cloud project storage",
      "Every required dimension included",
    ],
  },
  {
    id: "pro",
    name: "Pro pack",
    price: "$49",
    cadence: "one-off",
    description: "Pay per launch. 300 credits — roughly 20-25 packs. Best value for serial launchers.",
    flag: "Best value",
    cta: "Buy pack",
    ctaHref: "/sign-up?plan=pro",
    perks: [
      "300 credits, never expire",
      "20-25 full App Store packs",
      "Watermark removed",
      "Cloud project storage",
    ],
    comingNext: "Direct App Store Connect push",
  },
  {
    id: "studio",
    name: "Studio",
    price: "$29",
    cadence: "per month",
    description: "Ongoing production workflow. Unmetered AI. Cancel anytime from the Stripe portal.",
    highlight: true,
    cta: "Start Studio",
    ctaHref: "/sign-up?plan=studio",
    perks: [
      "Unlimited AI generations",
      "All 41 locales + every device frame",
      "Cloud project storage",
      "Manage subscription via Stripe portal",
    ],
    comingNext: "Public REST + webhook API",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "$149",
    cadence: "one-time, 500 seats",
    description: "Founder tier. One-time purchase, capped at first 500.",
    cta: "Reserve seat",
    ctaHref: "/sign-up?plan=lifetime",
    perks: [
      "Lifetime unmetered AI",
      "All future features included",
      "Priority support, named seat",
    ],
    comingNext: "Lifetime public API access",
  },
];

/**
 * PricingTable — recovery-cycle redesign.
 *
 * Was a 5-card grid with hairline-rule dividers (1px gap-px on bg
 * line), Archivo Black plan names + the ring-2 brutalist highlight
 * for the recommended plan. Now: rounded `surface` cards in a true
 * gap-3 grid, recommended plan visually elevated (accent border +
 * raised background), Check icons replace the ▸ glyph, cleaner
 * heading hierarchy.
 */
export function PricingTable() {
  const hasLifetime = Boolean(process.env.STRIPE_PRICE_LIFETIME);
  const visiblePlans = PLANS.filter((p) => p.id !== "lifetime" || hasLifetime);
  const colsClass = visiblePlans.length === 4
    ? "lg:grid-cols-4"
    : "lg:grid-cols-5";

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${colsClass} gap-3 md:gap-4`}>
      {visiblePlans.map((p) => (
        <article
          key={p.id}
          data-plan={p.id}
          className={`flex flex-col gap-5 min-h-[440px] p-6 rounded-[10px] transition-colors ${
            p.highlight
              ? "bg-[var(--bg-3)] border-2 border-[var(--accent)] shadow-[0_2px_20px_-8px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
              : "bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--line-strong)]"
          }`}
        >
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[18px] font-semibold tracking-[-0.015em] text-[var(--fg)] leading-tight">
                {p.name}
              </h3>
              <div className="text-[12px] text-[var(--fg-mute)] mt-0.5">{p.cadence}</div>
            </div>
            {p.highlight && (
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-fg)] bg-[var(--accent)] px-2 py-0.5 rounded-full shrink-0">
                Recommended
              </span>
            )}
            {p.flag && !p.highlight && (
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)] border border-[var(--accent)] px-2 py-0.5 rounded-full shrink-0">
                {p.flag}
              </span>
            )}
          </header>

          <div className="flex items-baseline gap-1.5">
            <span className={`font-semibold tracking-[-0.04em] tabular-nums ${
              p.highlight
                ? "text-[clamp(2.5rem,7vw,3.5rem)] text-[var(--accent)]"
                : "text-[clamp(2rem,6vw,2.75rem)] text-[var(--fg)]"
            }`}>{p.price}</span>
          </div>

          <p className="text-[14px] leading-snug text-[var(--fg-dim)]">{p.description}</p>

          <ul className="space-y-2.5 flex-1 pt-4 border-t border-[var(--line)]">
            {p.perks.map((perk) => (
              <li key={perk} className="text-[14px] text-[var(--fg)] flex gap-2.5 items-start leading-snug">
                <Check size={14} strokeWidth={2.5} className="text-[var(--accent)] mt-0.5 shrink-0" aria-hidden />
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          {p.comingNext && (
            <p className="text-[12px] text-[var(--fg-mute)] leading-snug pt-1">
              <span className="font-medium uppercase tracking-[0.08em] text-[10.5px] text-[var(--fg-mute)] mr-1.5">
                Coming next
              </span>
              {p.comingNext}
            </p>
          )}

          <Link
            href={p.ctaHref}
            className={`inline-flex items-center justify-center gap-1.5 text-[14px] font-semibold px-4 py-2.5 rounded-md transition-opacity ${
              p.highlight
                ? "bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90"
                : "bg-[var(--bg)] text-[var(--fg)] border border-[var(--line-strong)] hover:bg-[var(--bg-3)]"
            }`}
          >
            {p.cta}
            <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
          </Link>
        </article>
      ))}
    </div>
  );
}
