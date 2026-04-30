import Image from "next/image";
import Link from "next/link";
import { HeroBeforeAfterSlider } from "@/components/marketing/HeroBeforeAfterSlider";
import { HeroRotatingTitle, HeroSurfaceRotator } from "@/components/marketing/HeroRotatingTitle";

export function Hero() {
  return (
    <section className="relative border-b border-[var(--line)] overflow-hidden">
      {/* Atmospheric backdrop — quality bumped to 95 (default 75 caused
          visible banding in the gradient under mix-blend-screen). The
          dither layer below adds 1.5% grain noise to break up any
          residual banding from 8-bit color gradients. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none hero-backdrop"
      >
        <Image
          src="/hero-backdrop.png"
          alt=""
          fill
          priority
          quality={95}
          sizes="(max-width: 1024px) 100vw, 80vw"
          className="object-cover object-right-top opacity-90 mix-blend-screen select-none"
          draggable={false}
        />
        {/* Grain dither — masks 8-bit gradient banding without visible texture */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.045]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "200px 200px",
          }}
        />
      </div>
      <div className="absolute inset-0 blueprint pointer-events-none opacity-25" aria-hidden />

      <div className="relative z-10 max-w-[1480px] mx-auto px-4 md:px-8 pt-12 md:pt-16 pb-14 md:pb-20">
        <div className="grid grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Headline column */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-6 sm:gap-8 min-w-0">
            <HeroRotatingTitle />

            <p className="t-prose-lg max-w-[44ch]">
              Your app in every App Store format, every locale, every
              required dimension — in minutes. Drop in raw screenshots.
              Ship everything else.
            </p>

            {/* CTA row — primary + secondary on their own line */}
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

            {/* Trust microcopy — own row beneath the buttons. The
               built-in-public chip + "indie dev solo studio" line moved
               below the fold (lives in Footer / About) per UX audit
               P3 #12 — eight elements above-the-fold was overload. */}
            <p className="t-mono-xs text-[var(--fg-mute)] -mt-2 sm:-mt-3">
              No card · Free tier exports include a watermark
            </p>

            {/* Quiet "also exports" rotator — under the fold of the
               hero column on desktop, last row before the visual on
               mobile. Power-user discovery without H1 contention. */}
            <HeroSurfaceRotator />
          </div>

          {/* Interactive before / after — drag to compare */}
          <div className="col-span-12 lg:col-span-5 relative pt-8 sm:pt-10 lg:pt-0">
            <HeroBeforeAfterSlider />
          </div>
        </div>
      </div>
    </section>
  );
}
