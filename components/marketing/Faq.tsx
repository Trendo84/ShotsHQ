"use client";

import { useState } from "react";

const FAQS: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: "Why iOS only?",
    a: "Wedge focus. Indie iOS devs ship to one store with three required dimensions — that's a tractable problem. Android adds device fragmentation we'd rather not solve in v1.",
  },
  {
    q: "Are credits really good forever?",
    a: "Yes. Credits don't expire. Studio Monthly skips credits entirely. Lifetime includes a recurring monthly grant in perpetuity (within reason).",
  },
  {
    q: "What happens on a failed AI generation?",
    a: "Automatic refund. Every Trigger.dev task wraps the AI call and credits are returned to the ledger with a 'refund' reason on failure.",
  },
  {
    q: "Can I edit raw screenshots, or only AI-generated ones?",
    a: "Both. Polotno is the canvas — you can drag, type, swap layers, layer device frames, and export at any required dimension. AI is opt-in.",
  },
  {
    q: "Is there an API?",
    a: "Studio plan only. Generate, render, export — programmatic access for solo developers running CI/CD release pipelines.",
  },
  {
    q: "What's your data policy?",
    a: "Project assets live in Cloudflare R2 under your account. AI prompts are sent to OpenAI / fal.ai per their respective TOS; we don't retain prompts past 24 hours.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="border-b border-[var(--line)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-8 mb-12 items-end">
          <h2 className="col-span-12 md:col-span-7 t-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[0.95] text-balance">
            Questions, answered.
          </h2>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md">
            Still stuck? Email <a className="link-tick" href="mailto:support@shotshq.app">support@shotshq.app</a>. Human reply within 12 hours.
          </p>
        </div>

        <div className="border border-[var(--line)]">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <button
                key={f.q}
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="block w-full text-left border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--bg-2)] transition-colors focus-visible:outline-none focus-visible:bg-[var(--bg-2)] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
              >
                <div className="grid grid-cols-12 items-center gap-3 px-5 py-4">
                  <span className="col-span-1 t-eyebrow t-numeric">{String(i + 1).padStart(2, "0")}</span>
                  <span className="col-span-10 t-display text-[18px] md:text-[22px] leading-tight normal-case tracking-[-0.02em]">
                    {f.q}
                  </span>
                  <span className="col-span-1 text-right text-[var(--accent)] text-[20px] font-medium">
                    {isOpen ? "−" : "+"}
                  </span>
                </div>
                {isOpen && (
                  <div className="px-5 pb-5 grid grid-cols-12 gap-3">
                    <div className="col-span-1" />
                    <p className="col-span-10 t-prose">{f.a}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
