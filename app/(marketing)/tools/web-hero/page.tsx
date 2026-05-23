import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title:       "Web hero designer — ShotsHQ",
  description: "Generate website hero images at every required dimension — 1920×1080, 2880×1620, 4K. AI-driven, brand-aware, one click.",
  alternates:  { canonical: "/tools/web-hero" },
  openGraph: {
    title:       "Web hero designer — ShotsHQ",
    description: "Marketing hero shots that match your App Store screenshots.",
    url:         "/tools/web-hero",
  },
};

const VARIANTS = [
  { id: "1920x1080", label: "Standard", spec: "1920 × 1080" },
  { id: "2880x1620", label: "Retina",   spec: "2880 × 1620" },
  { id: "3840x2160", label: "4K",       spec: "3840 × 2160" },
];

const STYLES = [
  { id: "tactical-dark",    label: "Tactical dark",    sub: "Vercel / Linear vibes",       accent: "#FF2A2A" },
  { id: "warm-organic",     label: "Warm organic",     sub: "NYT Cooking / PulseChef",     accent: "#E74C3C" },
  { id: "minimal-light",    label: "Minimal light",    sub: "Notion / Stripe vibes",       accent: "#0066FF" },
  { id: "editorial",        label: "Editorial",        sub: "Substack / The New Yorker",   accent: "#0A0A0A" },
  { id: "playful-gradient", label: "Playful gradient", sub: "Headspace / Calm",            accent: "#9B59B6" },
  { id: "tech-minimal",     label: "Tech minimal",     sub: "Stripe / Modern Treasury",    accent: "#0066FF" },
];

export default function WebHeroDesignerPage() {
  return (
    <>
      {/* Hero strip */}
      <section className="border-b border-[var(--line)]">
        <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">
          <Reveal as="div" className="grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 md:col-span-7">
              <div className="t-eyebrow t-eyebrow-accent mb-3">
                ▸ Tool · Web hero designer
              </div>
              <h1 className="t-display text-[clamp(2.25rem,6.5vw,5rem)] leading-[0.92] text-balance">
                Marketing hero shots
                <br />
                <span className="text-[var(--accent)]">in every dimension.</span>
              </h1>
              <p className="t-prose-lg max-w-[46ch] mt-5 text-[var(--fg)]">
                Pick a style, paste your brand URL, get back wide hero
                images at every dimension your stack needs — 1920×1080,
                2880×1620, 4K. Same engine that ships your App Store
                pack today.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-7">
                <Link
                  href="/sign-up?surface=web-hero"
                  className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-5 pr-1.5 py-2 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                >
                  <span className="btn-label">Join the early-access list</span>
                  <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 font-bold">
                    →
                  </span>
                </Link>
                <span
                  className="inline-flex items-center gap-2 t-mono-xs uppercase tracking-[0.14em] text-[var(--fg-dim)]"
                  data-web-hero-status="early-access"
                >
                  <span aria-hidden className="block w-1.5 h-1.5 bg-[var(--accent)]" />
                  Designer ships v1.1 · App Store pipeline live today
                </span>
              </div>
            </div>

            {/* Sample hero output */}
            <div className="col-span-12 md:col-span-5">
              <div className="relative aspect-[16/9] border border-[var(--line-strong)] overflow-hidden bg-[var(--bg-2)]">
                <Image
                  src="/showcase/hero-1.png"
                  alt="Sample web hero output — ShotsHQ"
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
                <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-2 py-1 bg-black/75 text-white t-mono-xs uppercase tracking-[0.16em] backdrop-blur-sm">
                  <span aria-hidden className="block w-1.5 h-1.5 bg-[var(--accent)]" />
                  Sample output
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* What you get */}
      <section className="border-b border-[var(--line)] bg-[var(--bg-2)]">
        <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">
          <Reveal as="div" className="grid grid-cols-12 gap-8 mb-10 items-end">
            <h2 className="col-span-12 md:col-span-7 t-display text-[clamp(2rem,5vw,4rem)] leading-[0.95] text-balance">
              Three dimensions.<br />
              <span className="text-[var(--accent)]">One render.</span>
            </h2>
            <p className="col-span-12 md:col-span-5 t-prose max-w-md">
              Drop straight into Framer, Webflow, Next.js, or any static
              site. Auto-scaled for retina and 4K so the marketing site
              stays crisp on every screen.
            </p>
          </Reveal>

          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)]">
            {VARIANTS.map((v, i) => (
              <Reveal
                key={v.id}
                as="li"
                delay={i * 80}
                className="bg-[var(--bg)] p-6 flex flex-col gap-3 min-h-[160px]"
              >
                <div className="t-eyebrow t-eyebrow-accent">{v.label}</div>
                <div className="t-display text-[clamp(1.5rem,3vw,2.25rem)] leading-none t-numeric mt-auto">
                  {v.spec}
                </div>
                <div className="t-mono-xs text-[var(--fg-dim)] uppercase tracking-[0.14em]">
                  Lossless PNG · sRGB
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Style picker */}
      <section className="border-b border-[var(--line)]">
        <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">
          <Reveal as="div" className="grid grid-cols-12 gap-8 mb-10 items-end">
            <h2 className="col-span-12 md:col-span-7 t-display text-[clamp(2rem,5vw,4rem)] leading-[0.95] text-balance">
              Six art directions<br />
              <span className="text-[var(--accent)]">to choose from.</span>
            </h2>
            <p className="col-span-12 md:col-span-5 t-prose max-w-md">
              Each style is a locked palette, typography mood, and decoration
              system. Paste your brand URL, our AI extracts your colors and
              voice, and locks them into the chosen direction.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)]">
            {STYLES.map((s, i) => (
              <Reveal
                key={s.id}
                as="article"
                delay={(i % 3) * 60}
                className="bg-[var(--bg)] p-6 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="t-eyebrow">{s.id.toUpperCase()}</span>
                  <span
                    aria-hidden
                    className="inline-block w-3 h-3 border border-[var(--line-strong)]"
                    style={{ background: s.accent }}
                  />
                </div>
                <h3 className="t-display text-[clamp(1.25rem,2.5vw,1.75rem)] leading-tight">
                  {s.label}
                </h3>
                <p className="t-mono-sm text-[var(--fg-dim)]">{s.sub}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-[var(--line)]">
        <div className="relative z-10 max-w-[1480px] mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="grid grid-cols-12 gap-8 items-end">
            <h2 className="col-span-12 md:col-span-8 t-display text-[clamp(2.25rem,6vw,5rem)] leading-[0.92] text-balance">
              Stop screenshotting.<br />
              <span className="text-[var(--accent)]">Start designing.</span>
            </h2>
            <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
              <p className="t-prose max-w-sm text-[var(--fg)]">
                Sign up now to use the App Store screenshot pipeline
                today. Web-hero designer ships next — you&apos;ll be the
                first to know.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  href="/sign-up?surface=web-hero"
                  className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-5 pr-1.5 py-2 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                >
                  <span className="btn-label">Join the early-access list</span>
                  <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 font-bold">
                    →
                  </span>
                </Link>
                <Link href="/pricing" className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)]">
                  See pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="hazard h-2" aria-hidden />
      </section>
    </>
  );
}
