"use client";

import { useState } from "react";

const FAQS: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: "Why iOS only?",
    a: "We focus on iOS first because indie devs ship to one store with three required screenshot sizes — a solvable problem we can nail completely. Android's device fragmentation is on the roadmap for v2.",
  },
  {
    q: "Are credits really good forever?",
    a: "Yes. Credits don't expire. Studio Monthly skips credits entirely. Lifetime includes a recurring monthly grant in perpetuity (within reason).",
  },
  {
    q: "What happens on a failed AI generation?",
    a: "Automatic refund. The credits return to your ledger with a 'refund' reason — you don't pay for anything that didn't deliver.",
  },
  {
    q: "Can I edit raw screenshots, or only AI-generated ones?",
    a: "Both. The canvas editor lets you drag, type, swap layers, layer device frames, and export at any required dimension. AI is opt-in — every step is editable by hand.",
  },
  {
    q: "Is there an API?",
    a: "Studio plan only. Generate, render, export — programmatic access for solo developers running CI/CD release pipelines.",
  },
  {
    q: "Does the free tier add a watermark?",
    a: "Yes. Free-tier exports include a small SHOTSHQ watermark in the corner. It's removed automatically on any paid pack or Studio plan.",
  },
  {
    q: "What's your data policy?",
    a: "Your project assets live in your own private storage — only you and your team can access them. AI prompts run through partner providers under their respective terms; we don't retain prompts past 24 hours.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="border-b border-[var(--line)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">
        <div className="grid grid-cols-12 gap-8 mb-12 items-end">
          <h2 className="col-span-12 md:col-span-7 t-display t-h-3 text-balance">
            Questions, answered.
          </h2>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md">
            Still stuck? Email <a className="link-tick" href="mailto:support@shotshq.com">support@shotshq.com</a>. Human reply within 12 hours.
          </p>
        </div>

        <div className="border border-[var(--line)]">
          {FAQS.map((f, i) => {
            const isOpen   = open === i;
            const btnId    = `faq-q-${i}`;
            const panelId  = `faq-a-${i}`;
            return (
              <div key={f.q} className="border-b border-[var(--line)] last:border-b-0">
                <button
                  id={btnId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="block w-full text-left hover:bg-[var(--bg-2)] transition-colors focus-visible:outline-none focus-visible:bg-[var(--bg-2)] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
                >
                  <div className="grid grid-cols-12 items-center gap-3 px-5 py-4">
                    <span className="col-span-1 t-eyebrow t-numeric">{String(i + 1).padStart(2, "0")}</span>
                    <span className="col-span-10 text-[16px] md:text-[18px] leading-tight font-medium tracking-[-0.01em] text-[var(--fg)]">
                      {f.q}
                    </span>
                    <span className="col-span-1 text-right text-[var(--accent)] text-[20px] font-medium" aria-hidden>
                      {isOpen ? "−" : "+"}
                    </span>
                  </div>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  hidden={!isOpen}
                  className="px-5 pb-5 grid grid-cols-12 gap-3"
                >
                  <div className="col-span-1" />
                  <p className="col-span-10 t-prose">{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
