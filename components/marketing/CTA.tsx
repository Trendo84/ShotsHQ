import Link from "next/link";

export function CTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 blueprint opacity-50 pointer-events-none" aria-hidden />
      <div className="relative z-10 max-w-[1480px] mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-12 gap-8 items-end">
          <h2 className="col-span-12 md:col-span-8 t-display text-[clamp(2.75rem,7.5vw,6.5rem)] leading-[0.92] text-balance">
            Stop designing.<br />
            <span className="text-[var(--accent)]">Start shipping.</span>
          </h2>
          <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
            <p className="t-prose max-w-sm">
              Free forever, no card. Watermark on free exports — remove it
              with any pack.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-5 pr-1.5 py-2 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
              >
                <span className="btn-label">Start free</span>
                <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 font-bold">
                  →
                </span>
              </Link>
              <Link href="/pricing" className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)]">
                Plan breakdown
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="hazard h-2" aria-hidden />
    </section>
  );
}
