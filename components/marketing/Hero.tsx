import { HeroBeforeAfterSlider } from "@/components/marketing/HeroBeforeAfterSlider";
import { HeroCta } from "@/components/marketing/HeroCta";

/**
 * Marketing hero — recovery-cycle redesign.
 *
 * Was the original brutalist treatment: pure black + hot-red, Archivo
 * Black ALL-CAPS shouting "Ship App Store / SCREENSHOTS / before
 * coffee.", a hero-backdrop bloom image + blueprint grid + grain
 * noise + three trust chips + rotating "Also exports …" line.
 *
 * Now: a calmer two-column hero on a graphite surface with a single
 * focused message, one primary CTA + one secondary link, and the
 * interactive before/after slider as the proof element. The headline
 * uses the new soft-display utility (Geist Sans 700 at negative
 * tracking) and an italic-serif "every locale, every dimension" line
 * as the editorial disruptor. No backdrop image, no blueprint grid —
 * the previous atmospheric layers were exactly the noise the
 * redesign brief called out.
 */
export function Hero() {
  return (
    <section className="relative border-b border-[var(--line)] overflow-hidden">
      {/* Subtle radial wash — single soft gradient, no scanlines, no
         grain. Reads as depth, not telemetry. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(900px 420px at 22% -10%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 70%)",
        }}
      />

      <div className="relative max-w-[1480px] mx-auto px-4 md:px-6 lg:px-8 pt-16 md:pt-24 lg:pt-28 pb-14 md:pb-20">
        <div className="grid grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Headline column */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-7 min-w-0">
            <div className="inline-flex self-start items-center gap-2 text-[12px] text-[var(--fg-dim)]">
              <span aria-hidden className="block w-1.5 h-1.5 rounded-full bg-[var(--signal)]" />
              <span>Live · App Store screenshot pipeline shipping today</span>
            </div>

            <h1 className="text-[clamp(2.5rem,6vw,5.25rem)] font-semibold tracking-[-0.045em] leading-[1.02] text-[var(--fg)] text-balance">
              Drop in raw screenshots.
              <br />
              <span className="text-[var(--accent)]">Ship a polished pack</span>
              <br />
              by the time the coffee&apos;s ready.
            </h1>

            <p className="text-[17px] leading-[1.55] text-[var(--fg-dim)] max-w-[52ch]">
              ShotsHQ turns Xcode-simulator PNGs into a complete App
              Store pack — headlines, backdrops, every required
              dimension, every locale. <span className="text-[var(--fg)]">One source.</span>{" "}
              <span className="text-[var(--fg)]">One render pass.</span>{" "}
              <span className="text-[var(--fg)]">No design step.</span>
            </p>

            <HeroCta />

            {/* Trust microcopy — three concrete, two are buyer-side, one
               is the "no card" qualifier. No ALL CAPS. */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-[var(--fg-mute)]">
              <span>No card required</span>
              <span aria-hidden>·</span>
              <span>41 locales</span>
              <span aria-hidden>·</span>
              <span>iPhone + iPad export-ready</span>
            </div>
          </div>

          {/* Interactive before/after — drag to compare */}
          <div className="col-span-12 lg:col-span-5 relative pt-2 sm:pt-4 lg:pt-0">
            <HeroBeforeAfterSlider />
          </div>
        </div>
      </div>
    </section>
  );
}
