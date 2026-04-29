import type { Metadata } from "next";
import { PricingTable } from "@/components/billing/PricingTable";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free tier, credit packs, monthly subscription, and a capped lifetime deal. No subscription traps.",
};

export default function PricingPage() {
  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-20 md:py-28">
          <div className="grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 md:col-span-7">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Pricing</div>
              <h1 className="t-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.92] text-balance">
                Plans &amp; packs.
              </h1>
            </div>
            <div className="col-span-12 md:col-span-5">
              <p className="t-prose-lg max-w-md">
                Five lanes. Pick the one that matches your launch cadence.
                Credits never expire; subscriptions cancel from settings,
                no email friction. Lifetime is capped at 500 seats.
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
          <div className="grid grid-cols-12 gap-8 mb-10">
            <div className="col-span-12 md:col-span-5">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Credit cost table</div>
              <h2 className="t-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[0.95] text-balance">
                What each operation costs.
              </h2>
            </div>
            <div className="col-span-12 md:col-span-6 md:col-start-7 flex items-end">
              <p className="t-prose">
                Studio and Lifetime plans skip credits entirely — metered
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
