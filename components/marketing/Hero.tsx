import Image from "next/image";
import Link from "next/link";
import { HeroBeforeAfter } from "@/components/marketing/HeroBeforeAfter";
import { HeroRotatingTitle } from "@/components/marketing/HeroRotatingTitle";

export function Hero() {
  return (
    <section className="relative border-b border-[var(--line)] overflow-hidden">
      {/* Atmospheric backdrop */}
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

      <div className="relative z-10 max-w-[1480px] mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-20 md:pb-28">
        <div className="grid grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Headline column */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-6 sm:gap-8 min-w-0">
            <HeroRotatingTitle />

            <p className="t-prose-lg max-w-[40ch]">
              Drop in your raw iOS screenshots. Get App Store listings,
              hero shots, OG cards, and 41 locales — every required
              dimension, in minutes.
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
              <span className="t-mono-xs text-[var(--fg-mute)]">
                No card · Free tier exports include a watermark
              </span>
            </div>

            {/* Trust chip */}
            <div className="flex items-center gap-2 t-mono-xs text-[var(--fg-mute)]">
              <span className="inline-flex items-center gap-1.5 border border-[var(--signal)] text-[var(--signal)] px-2 py-1 uppercase tracking-[0.16em]">
                <span className="block w-1.5 h-1.5 rounded-full bg-[var(--signal)]" />
                Pre-launch
              </span>
              <span className="hidden sm:inline">
                · Built by an indie dev for indie devs
              </span>
            </div>
          </div>

          {/* Before / After composition */}
          <div className="col-span-12 lg:col-span-5 relative pt-8 sm:pt-10 lg:pt-0">
            <HeroBeforeAfter />
          </div>
        </div>
      </div>
    </section>
  );
}
