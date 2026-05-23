import Link from "next/link";

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
  perks: string[];
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "Unlimited editor, 1080p exports with watermark.",
    cta: "Open console",
    ctaHref: "/sign-up",
    perks: [
      "Unlimited project editor",
      "1080p watermarked exports",
      "All device frames",
      "Local-only project storage",
    ],
  },
  {
    id: "indie",
    name: "Indie pack",
    price: "$19",
    cadence: "one-off",
    description: "100 credits — roughly 6-8 full sets. Never expires.",
    cta: "Buy pack",
    ctaHref: "/sign-up?plan=indie",
    perks: [
      "100 credits, never expire",
      "Watermark removed",
      "6-8 full sets per pack",
      "Cloud project storage",
      "Export at every App Store dimension",
    ],
  },
  {
    id: "pro",
    name: "Pro pack",
    price: "$49",
    cadence: "one-off",
    description: "300 credits — roughly 20-25 full sets. Best value for serial launchers.",
    flag: "Best value",
    cta: "Buy pack",
    ctaHref: "/sign-up?plan=pro",
    perks: [
      "300 credits, never expire",
      "20-25 full sets per pack",
      "Watermark removed",
      "Cloud project storage",
      "Direct App Store Connect push · v1.1",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    price: "$29",
    cadence: "per month",
    description: "Unmetered AI. Cancel anytime via the Stripe billing portal — projects stay readable for 30 days.",
    highlight: true,
    cta: "Subscribe",
    ctaHref: "/sign-up?plan=studio",
    perks: [
      "Unlimited AI generations",
      "All 41 locales + 3 Apple device frames",
      "Cloud project storage",
      "Manage subscription via Stripe portal",
      "Public REST + webhook API · v1.1",
    ],
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
      "Lifetime API access · v1.1",
      "Priority support, named seat",
    ],
  },
];

export function PricingTable() {
  // Lifetime is gated on the env presence of its price ID — when the SKU
  // isn't configured we hide the tier from the UI entirely.
  const hasLifetime = Boolean(process.env.STRIPE_PRICE_LIFETIME);
  const visiblePlans = PLANS.filter((p) => p.id !== "lifetime" || hasLifetime);
  const colsClass = visiblePlans.length === 4
    ? "lg:grid-cols-4"
    : "lg:grid-cols-5";

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${colsClass} gap-px bg-[var(--line)] border border-[var(--line)]`}>
      {visiblePlans.map((p) => (
        <article
          key={p.id}
          className={`bg-[var(--bg)] p-6 flex flex-col gap-5 min-h-[460px] relative ${
            p.highlight ? "ring-2 ring-inset ring-[var(--accent)]" : ""
          }`}
        >
          {p.highlight && (
            <span className="absolute top-3 right-3 t-eyebrow text-[var(--accent-fg)] bg-[var(--accent)] px-2 py-0.5 normal-case tracking-[0.05em]">
              Recommended
            </span>
          )}
          {p.flag && !p.highlight && (
            <span className="absolute top-3 right-3 t-eyebrow text-[var(--accent)] border border-[var(--accent)] px-2 py-0.5 normal-case tracking-[0.05em]">
              {p.flag}
            </span>
          )}

          <div>
            <div className="t-display text-[clamp(1.5rem,3.5vw,1.625rem)] leading-[0.95] normal-case tracking-[-0.02em]">{p.name}</div>
            <div className="text-[12px] text-[var(--fg-dim)] mt-1">{p.cadence}</div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className={`t-display leading-[0.85] tracking-[-0.05em] t-numeric ${p.highlight ? "text-[clamp(2.75rem,8vw,4rem)] text-[var(--accent)]" : "text-[clamp(2.25rem,7vw,3.25rem)]"}`}>{p.price}</span>
          </div>

          <p className="t-prose text-[13.5px]">{p.description}</p>

          <ul className="space-y-2 flex-1 pt-3 border-t border-[var(--line)]">
            {p.perks.map((perk) => (
              <li key={perk} className="text-[13.5px] text-[var(--fg)] flex gap-2">
                <span className="text-[var(--accent)] flex-none mt-0.5">▸</span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          <Link href={p.ctaHref} className={p.highlight ? "btn btn-accent" : "btn"}>
            {p.cta} →
          </Link>
        </article>
      ))}
    </div>
  );
}
