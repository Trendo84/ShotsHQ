import type { Metadata } from "next";
import Link from "next/link";
import { PricingTable } from "@/components/billing/PricingTable";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free tier, credit packs, and Studio subscription. No subscription traps.",
};

const PRICING_FAQS: { q: string; a: string }[] = [
  {
    q: "What counts as one full set?",
    a: "A 'set' is a complete pack of App Store screenshots for one app — typically 6 frames in one locale. At ~12-15 credits per set (2 cr/backdrop × 6 frames + 1 cr copy gen), the Indie pack covers 6-8 sets and the Pro pack covers 20-25 sets.",
  },
  {
    q: "Can I buy credit packs on top of Studio?",
    a: "Yes — Studio includes unmetered AI for the subscription holder, but if you exceed the soft fairness limits or want to gift credits to a teammate, packs stack onto your account.",
  },
  {
    q: "What happens to my projects if I cancel Studio?",
    a: "Projects and previously-rendered exports stay accessible for 30 days post-cancellation. After that, projects are archived (read-only) for another 60 days, then deleted. You can re-export at any point during the readable window.",
  },
  {
    q: "Is the free tier really unlimited or is there a project cap?",
    a: "Unlimited projects, unlimited editor time. Free-tier exports include a small ShotsHQ watermark in the corner — that's the only catch. The watermark is removed automatically on any paid pack or Studio plan.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">
          <div className="grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 md:col-span-7">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Pricing</div>
              <h1 className="t-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.92] text-balance">
                <span className="whitespace-nowrap">Plans &amp; packs.</span>
              </h1>
            </div>
            <div className="col-span-12 md:col-span-5">
              <p className="t-prose-lg max-w-md">
                Pick the lane that matches your launch cadence. Credits
                never expire; subscriptions cancel from settings, no
                email friction.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-12">
        <PricingTable />
      </div>

      <section className="border-y border-[var(--line)] bg-[var(--bg-2)]">
        <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-16">
          {/* FAQ — answers the questions blocking purchase */}
          <div className="grid grid-cols-12 gap-8 mb-16">
            <div className="col-span-12 md:col-span-4">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Pricing FAQ</div>
              <h2 className="t-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[0.95] text-balance">
                Common questions before you buy.
              </h2>
              <p className="t-prose mt-4">
                Read the full <Link href="/docs/billing" className="link-tick">billing docs</Link>{" "}
                or email{" "}
                <a href="mailto:support@shotshq.com" className="link-tick">support@shotshq.com</a>.
              </p>
            </div>
            <ul className="col-span-12 md:col-span-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {PRICING_FAQS.map((f) => (
                <li key={f.q} className="py-5">
                  <div className="t-mono-xs uppercase tracking-[0.16em] text-[var(--accent)] mb-1.5">
                    Q.
                  </div>
                  <h3 className="text-[16px] font-medium text-[var(--fg)] leading-snug mb-2">
                    {f.q}
                  </h3>
                  <p className="t-prose text-[14px]">{f.a}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-12 gap-8 mb-10">
            <div className="col-span-12 md:col-span-5">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Credit cost table</div>
              <h2 className="t-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[0.95] text-balance">
                What each operation costs.
              </h2>
            </div>
            <div className="col-span-12 md:col-span-6 md:col-start-7 flex items-end">
              <p className="t-prose">
                Studio subscribers skip credits entirely — usage is metered
                internally for abuse prevention only.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)]">
            {[
              { label: "AI copy generation",    cost: 1, body: "AI-generated headline, subheadline, and CTA — guaranteed well-formed." },
              { label: "AI backdrop",           cost: 2, body: "Subject-aware AI background generation in your brand's palette." },
              { label: "AI restyle from ref",   cost: 3, body: "Lift palette and mood from a reference, restyle the full pack." },
              { label: "Translate (per locale)",cost: 1, body: "Auto-relayout, RTL-aware, parallel fan-out." },
              { label: "Standard export",       cost: 0, body: "Server-side render to every required App Store dimension." },
              { label: "App Store Connect upload", cost: 0, body: "Push generated assets directly to App Store Connect." },
            ].map((row) => (
              <div key={row.label} className="bg-[var(--bg)] p-5 flex flex-col gap-3 min-h-[150px]">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[14px] font-medium text-[var(--fg)]">{row.label}</span>
                  <span className="t-display text-[24px] t-numeric">
                    {row.cost === 0 ? "Free" : `${row.cost} cr`}
                  </span>
                </div>
                <p className="t-prose text-[13px] mt-auto">{row.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
