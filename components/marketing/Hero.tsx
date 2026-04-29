import Image from "next/image";
import Link from "next/link";
import { PhoneShowcase } from "@/components/marketing/PhoneShowcase";

export function Hero() {
  return (
    <section className="relative border-b border-[var(--line)] overflow-hidden">
      {/* Atmospheric backdrop — radial bloom for tactical, blueprint grid for both */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none hero-backdrop"
      >
        <Image
          src="/hero-backdrop.png"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 80vw"
          className="object-cover object-right-top opacity-90 mix-blend-screen select-none"
          draggable={false}
        />
      </div>
      <div className="absolute inset-0 blueprint pointer-events-none opacity-25" aria-hidden />

      <div className="relative z-10 max-w-[1480px] mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-24 md:pb-32">
        <div className="grid grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Headline */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-8 min-w-0">
            <h1 className="t-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.92] text-balance">
              Ship App&nbsp;Store
              <br />
              <span className="text-[var(--accent)]">screenshots</span>
              <br />
              before&nbsp;coffee.
            </h1>

            <p className="t-prose-lg max-w-[36ch]">
              Drop in raw iOS screens. Get five to eight polished listing
              images — copy, device frames, backdrops, 41 locales, every
              required dimension — in under five minutes.
            </p>

            <div className="flex flex-wrap gap-3 items-center">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-5 pr-1.5 py-2 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
              >
                <span className="btn-label">Start free</span>
                <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 leading-none font-bold">
                  <span aria-hidden className="-mt-px">→</span>
                </span>
              </Link>
              <Link
                href="/pricing"
                className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)] transition-colors px-2 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
              >
                See pricing
              </Link>
            </div>
          </div>

          {/* Phone showcase */}
          <div className="col-span-12 lg:col-span-4 relative">
            <PhoneShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
