import { HeroBeforeAfterSlider } from "@/components/marketing/HeroBeforeAfterSlider";
import { HeroCta } from "@/components/marketing/HeroCta";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--line)]">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(900px 420px at 22% -10%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1480px] px-4 pb-14 pt-16 md:px-6 md:pb-20 md:pt-24 lg:px-8 lg:pt-28">
        <div className="grid grid-cols-12 items-center gap-8 lg:gap-14">
          <div className="col-span-12 flex min-w-0 flex-col gap-7 lg:col-span-7">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--line)] bg-[var(--bg-2)] px-3 py-1 text-[12px] text-[var(--fg-dim)]">
              <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
              App Store screenshot workflow, live today
            </div>

            <h1 className="text-balance text-[clamp(2.5rem,6vw,5.1rem)] font-semibold tracking-[-0.045em] leading-[1.02] text-[var(--fg)]">
              App Store screenshots
              <br />
              <span className="text-[var(--accent)]">that look launch-ready</span>
              <br />
              without a design detour.
            </h1>

            <p className="max-w-[54ch] text-[17px] leading-[1.55] text-[var(--fg-dim)]">
              Drop in the raw screenshots from Xcode or Simulator. ShotsHQ turns them into a complete pack — copy, backdrops, every required size, every locale — in one focused workflow.
            </p>

            <HeroCta />

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-[var(--fg-mute)]">
              <span>No card required</span>
              <span aria-hidden>·</span>
              <span>41 locales</span>
              <span aria-hidden>·</span>
              <span>iPhone + iPad export-ready</span>
            </div>
          </div>

          <div className="relative col-span-12 pt-2 sm:pt-4 lg:col-span-5 lg:pt-0">
            <HeroBeforeAfterSlider />
          </div>
        </div>
      </div>
    </section>
  );
}
