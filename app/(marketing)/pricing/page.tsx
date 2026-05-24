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
        <div className="mx-auto max-w-[1480px] px-4 py-14 md:px-8 md:py-20">
          <div className="grid grid-cols-12 items-end gap-8">
            <div className="col-span-12 md:col-span-7">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Pricing</div>
              <h1 className="text-balance text-[clamp(2.4rem,6vw,5rem)] font-semibold tracking-[-0.045em] leading-[1.02] text-[var(--fg)]">
                Choose the plan
                <br />
                <span className="text-[var(--accent)]">that fits your launch pace.</span>
              </h1>
            </div>
            <div className="col-span-12 md:col-span-5">
              <p className="t-prose-lg max-w-md text-[var(--fg)]">
                Start free, move to packs for one-off launches, or stay in Studio if screenshots are part of your regular shipping cadence.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4 lg:mt-12">
            {[
              { lane: "Free", pitch: "Try the full editor.", sub: "Watermarked exports · no card." },
              { lane: "Packs", pitch: "Pay per launch.", sub: "Buy credits, ship a pack, done.", flag: true },
              { lane: "Studio", pitch: "Keep the workflow always on.", sub: "Unmetered AI · $29 / month." },
            ].map((row) => (
              <div
                key={row.lane}
                className={`rounded-[12px] border p-4 ${row.flag ? "border-[var(--accent)] bg-[var(--bg-2)]" : "border-[var(--line)] bg-[var(--bg)]"}`}
              >
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="t-eyebrow t-eyebrow-accent">{row.lane}</span>
                  {row.flag && <span className="text-[12px] text-[var(--accent)]">Most teams start here</span>}
                </div>
                <div className="text-[15px] font-medium text-[var(--fg)] leading-snug">{row.pitch}</div>
                <div className="mt-1 text-[12.5px] text-[var(--fg-dim)]">{row.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1480px] px-4 py-12 md:px-8">
        <PricingTable />
      </div>

      <section className="border-y border-[var(--line)] bg-[var(--bg-2)]">
        <div className="mx-auto max-w-[1480px] px-4 py-16 md:px-8">
          <div className="mb-16 grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-4">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Pricing FAQ</div>
              <h2 className="text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.035em] leading-[1.04] text-[var(--fg)]">
                Common questions before you buy.
              </h2>
              <p className="t-prose mt-4">
                Read the full <Link href="/docs/billing" className="link-tick">billing docs</Link>{" "}
                or email <a href="mailto:support@shotshq.com" className="link-tick">support@shotshq.com</a>.
              </p>
            </div>
            <ul className="col-span-12 divide-y divide-[var(--line)] border-y border-[var(--line)] md:col-span-8">
              {PRICING_FAQS.map((f) => (
                <li key={f.q} className="py-5">
                  <div className="mb-1.5 text-[12px] text-[var(--accent)]">Question</div>
                  <h3 className="mb-2 text-[16px] font-medium text-[var(--fg)] leading-snug">{f.q}</h3>
                  <p className="t-prose text-[14px]">{f.a}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8 grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-5">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Credit reference</div>
              <h2 className="text-balance text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.03em] leading-[1.04] text-[var(--fg)]">
                What each AI run costs.
              </h2>
            </div>
            <div className="col-span-12 flex items-end md:col-span-6 md:col-start-7">
              <p className="t-prose text-[var(--fg-dim)]">
                Studio subscribers skip credits entirely. This table is here as a reference, not as homework before purchase.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px rounded-[12px] border border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
            {[
              { label: "AI copy generation", cost: 1, body: "AI-generated headline, subheadline, and CTA — guaranteed well-formed." },
              { label: "AI backdrop (per frame)", cost: 2, body: "Flux 2 swaps the surrounding scene around your screenshot. Single frame, your UI untouched." },
              { label: "AI template set", cost: 8, body: "gpt-image-1 generates a cohesive 6-frame App Store carousel from your app metadata." },
              { label: "AI restyle from ref", cost: 3, body: "Lift palette and mood from a reference, restyle the full pack." },
              { label: "Translate (per locale)", cost: 1, body: "Auto-relayout, RTL-aware, parallel fan-out." },
              { label: "Export pack", cost: 0, body: "Studio renders every active panel at App Store-exact dimensions. Direct App Store Connect push is a v1.1 target." },
            ].map((row) => (
              <div key={row.label} className="flex min-h-[150px] flex-col gap-3 rounded-[0] bg-[var(--bg)] p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[14px] font-medium text-[var(--fg)]">{row.label}</span>
                  <span className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--fg)]">
                    {row.cost === 0 ? "Free" : `${row.cost} cr`}
                  </span>
                </div>
                <p className="t-prose mt-auto text-[13px]">{row.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
