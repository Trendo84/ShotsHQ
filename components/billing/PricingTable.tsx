import { Check } from "lucide-react";
import { AppCta } from "@/components/marketing/AppCta";

type CtaPayload = {
  label: string;
  href: string;
};

type Plan = {
  id: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  highlight?: boolean;
  flag?: string;
  signedOut: CtaPayload;
  signedIn: CtaPayload;
  perks: string[];
  comingNext?: string;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "Try the workflow. Watermarked exports.",
    signedOut: { label: "Start free", href: "/sign-up" },
    signedIn: { label: "Open dashboard", href: "/dashboard" },
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
    signedOut: { label: "Buy pack", href: "/sign-up?plan=indie" },
    signedIn: { label: "Buy pack", href: "/billing?plan=indie" },
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
    signedOut: { label: "Buy pack", href: "/sign-up?plan=pro" },
    signedIn: { label: "Buy pack", href: "/billing?plan=pro" },
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
    signedOut: { label: "Start Studio", href: "/sign-up?plan=studio" },
    signedIn: { label: "Upgrade to Studio", href: "/billing?plan=studio" },
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
    signedOut: { label: "Reserve seat", href: "/sign-up?plan=lifetime" },
    signedIn: { label: "Reserve seat", href: "/billing?plan=lifetime" },
    perks: [
      "Lifetime unmetered AI",
      "All future features included",
      "Priority support, named seat",
    ],
    comingNext: "Lifetime public API access",
  },
];

export function PricingTable() {
  const hasLifetime = Boolean(process.env.STRIPE_PRICE_LIFETIME);
  const visiblePlans = PLANS.filter((p) => p.id !== "lifetime" || hasLifetime);
  const colsClass = visiblePlans.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-5";

  return (
    <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 ${colsClass}`}>
      {visiblePlans.map((p) => (
        <article
          key={p.id}
          data-plan={p.id}
          className={`flex min-h-[440px] flex-col gap-5 rounded-[12px] p-6 transition-colors ${
            p.highlight
              ? "border-2 border-[var(--accent)] bg-[var(--bg-3)] shadow-[0_2px_20px_-8px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
              : "border border-[var(--line)] bg-[var(--bg-2)] hover:border-[var(--line-strong)]"
          }`}
        >
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[18px] font-semibold tracking-[-0.015em] text-[var(--fg)] leading-tight">
                {p.name}
              </h3>
              <div className="mt-0.5 text-[12px] text-[var(--fg-mute)]">{p.cadence}</div>
            </div>
            {p.highlight && (
              <span className="shrink-0 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent-fg)]">
                Recommended
              </span>
            )}
            {p.flag && !p.highlight && (
              <span className="shrink-0 rounded-full border border-[var(--accent)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)]">
                {p.flag}
              </span>
            )}
          </header>

          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-semibold tracking-[-0.04em] tabular-nums ${
                p.highlight
                  ? "text-[clamp(2.5rem,7vw,3.5rem)] text-[var(--accent)]"
                  : "text-[clamp(2rem,6vw,2.75rem)] text-[var(--fg)]"
              }`}
            >
              {p.price}
            </span>
          </div>

          <p className="text-[14px] leading-snug text-[var(--fg-dim)]">{p.description}</p>

          <ul className="flex-1 space-y-2.5 border-t border-[var(--line)] pt-4">
            {p.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-[14px] text-[var(--fg)] leading-snug">
                <Check size={14} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[var(--accent)]" aria-hidden />
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          {p.comingNext && (
            <p className="pt-1 text-[12px] leading-snug text-[var(--fg-mute)]">
              <span className="mr-1.5 text-[10.5px] font-medium tracking-[0.08em] text-[var(--fg-mute)] uppercase">
                Coming next
              </span>
              {p.comingNext}
            </p>
          )}

          <AppCta
            signedOut={p.signedOut}
            signedIn={p.signedIn}
            className="justify-center"
            dataCtaTag={`pricing-${p.id}`}
          />
        </article>
      ))}
    </div>
  );
}
