"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Three staggered App Store screenshot compositions — the actual artifact
 * ShotsHQ produces. NOT raw app screens. Each frame is:
 *   1. A colored backdrop with art direction (texture, decor, motif)
 *   2. A massive marketing headline (~55% of frame)
 *   3. A small embedded iPhone preview at the bottom showing a glimpse
 *      of the app — top half clipped above the bottom edge.
 *
 * The phone preview itself is a real GPT-image-gen asset
 * (`/public/app-preview-{tideline,focus,lentil}.png`) — we let the
 * generated artwork carry the device chrome and contents instead of
 * faking them in SVG.
 */

type Variant = "tideline" | "focusforge" | "lentil";

type Frame = {
  variant: Variant;
  tilt: number;
  yOffset: number;
  z: number;
  enterTilt: number;
};

const FRAMES: Frame[] = [
  { variant: "tideline",   tilt: -4, yOffset:  14, z: 10, enterTilt: -12 },
  { variant: "focusforge", tilt:  3, yOffset: -14, z: 30, enterTilt:   0 },
  { variant: "lentil",     tilt: -2, yOffset:  14, z: 20, enterTilt:  12 },
];

export function PhoneShowcase({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRevealed(true);
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`relative w-full min-h-[360px] sm:min-h-[480px] flex items-center justify-center ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[80%] pointer-events-none transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in srgb, var(--accent) 24%, transparent) 0%, transparent 65%)",
          opacity: revealed ? 1 : 0,
        }}
      />

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-3 lg:gap-5 items-center w-full max-w-[300px] sm:max-w-[640px]">
        {FRAMES.map((f, i) => {
          const settled = `rotate(${f.tilt}deg) translateY(${f.yOffset}px)`;
          const enter   = `rotate(${f.enterTilt}deg) translateY(${f.yOffset + 24}px)`;
          return (
            <div
              key={f.variant}
              className="group relative transition-transform duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:!transform-none hover:-translate-y-2 phone-frame-wrap"
              style={{
                transform: revealed ? settled : enter,
                transitionDelay: `${i * 90}ms`,
                zIndex: f.z,
              }}
            >
              <ScreenshotComposition variant={f.variant} />
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 639px) {
          .phone-frame-wrap {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function ScreenshotComposition({ variant }: { variant: Variant }) {
  if (variant === "tideline")   return <Tideline />;
  if (variant === "focusforge") return <FocusForge />;
  return <Lentil />;
}

/* ─────────────  TIDELINE — Editorial Luxury  ───────────── */

function Tideline() {
  const bg = "#0B1620";
  const fg = "#F2F6FA";
  const accent = "#3CC8FF";
  return (
    <Composition bg={bg} fg={fg}>
      <svg
        aria-hidden
        viewBox="0 0 100 200"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.55 }}
      >
        <defs>
          <linearGradient id="tlsky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0B1620" />
            <stop offset="60%" stopColor="#0E1F2E" />
            <stop offset="100%" stopColor="#102A3C" />
          </linearGradient>
        </defs>
        <rect width="100" height="200" fill="url(#tlsky)" />
        <path d="M0 130 Q 25 118 50 128 T 100 124 V 200 H 0 Z" fill={accent} fillOpacity="0.08" />
        <path d="M0 142 Q 25 132 50 142 T 100 138 V 200 H 0 Z" fill={accent} fillOpacity="0.10" />
        <path d="M0 158 Q 25 148 50 158 T 100 154 V 200 H 0 Z" fill={accent} fillOpacity="0.14" />
      </svg>

      <Eyebrow color={accent}>Surf · Pacifica CA</Eyebrow>

      <h3
        className="relative z-10 leading-[0.82] tracking-[-0.05em] text-[clamp(1.625rem,4vw,2.125rem)] mt-1"
        style={{ fontFamily: "var(--font-display)", color: fg }}
      >
        Catch the<br />
        <span
          style={{
            fontFamily: "var(--font-serif), serif",
            fontStyle: "italic",
            color: accent,
            fontWeight: 400,
            letterSpacing: "-0.03em",
          }}
        >
          perfect
        </span>
        <br />set.
      </h3>

      <SubLine fg={fg}>Wave height · Wind · Tide window</SubLine>

      <PreviewInset
        src="/app-preview-tideline.png"
        alt="Tideline app showing wave height 4.2 ft and forecast chart"
      />
    </Composition>
  );
}

/* ─────────────  FOCUSFORGE — Soft Structuralism  ───────────── */

function FocusForge() {
  const bg = "#F1ECE2";
  const fg = "#141414";
  const accent = "#FF6A2C";
  return (
    <Composition bg={bg} fg={fg}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${fg} 0.9px, transparent 1.4px)`,
          backgroundSize: "9px 9px",
          opacity: 0.07,
        }}
      />
      <span
        aria-hidden
        className="absolute -right-6 top-[24%] w-[120%] h-[8px]"
        style={{ background: accent, transform: "rotate(-22deg)", opacity: 0.92 }}
      />

      <Eyebrow color={accent}>Deep work · Session 03</Eyebrow>

      <h3
        className="relative z-10 leading-[0.84] tracking-[-0.045em] text-[34px] mt-1"
        style={{ fontFamily: "var(--font-display)", color: fg }}
      >
        Block<br />the
        <span
          style={{
            fontFamily: "var(--font-serif), serif",
            fontStyle: "italic",
            color: accent,
            fontWeight: 400,
          }}
        >
          {" "}noise.
        </span>
      </h3>

      <SubLine fg={fg}>42 minutes left · ⌘ ⏎ to lock in</SubLine>

      <PreviewInset
        src="/app-preview-focus.png"
        alt="FocusForge app showing 42:18 timer with three apps blocked"
      />
    </Composition>
  );
}

/* ─────────────  LENTIL — Ethereal Glass  ───────────── */

function Lentil() {
  const bg = "#0E1410";
  const fg = "#EAEFEA";
  const accent = "#69D26A";
  return (
    <Composition bg={bg} fg={fg}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(circle at 75% 18%, color-mix(in srgb, ${accent} 35%, transparent) 0%, transparent 55%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            `linear-gradient(${fg} 1px, transparent 1px), linear-gradient(90deg, ${fg} 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
          opacity: 0.05,
        }}
      />

      <Eyebrow color={accent}>Inventory · 24 items</Eyebrow>

      <h3
        className="relative z-10 leading-[0.84] tracking-[-0.045em] text-[clamp(1.5rem,3.6vw,2rem)] mt-1"
        style={{ fontFamily: "var(--font-display)", color: fg }}
      >
        What's in<br />
        <span style={{ color: accent }}>the&nbsp;fridge?</span>
      </h3>

      <SubLine fg={fg}>Auto-detect · Expiry alerts · Recipes</SubLine>

      <div
        className="relative z-10 inline-flex items-center gap-1.5 px-1.5 py-1 self-start mt-1.5"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: `0.75px solid color-mix(in srgb, ${fg} 18%, transparent)`,
        }}
      >
        <span className="block w-1 h-1" style={{ background: accent }} />
        <span
          className="text-[6px] uppercase tracking-[0.18em] font-semibold"
          style={{ color: fg, fontFamily: "var(--font-mono)" }}
        >
          1 expiring · sourdough
        </span>
      </div>

      <PreviewInset
        src="/app-preview-lentil.png"
        alt="Lentil app showing fridge inventory with sourdough expiring in 1 day"
      />
    </Composition>
  );
}

/* ────────────────────────────────────────────────
   Shared composition primitives
   ──────────────────────────────────────────────── */

function Composition({
  bg,
  fg,
  children,
}: {
  bg: string;
  fg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative aspect-[9/19.5] w-full overflow-hidden">
      <div className="absolute inset-0" style={{ background: bg }} />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow:
            `inset 0 0 0 1px color-mix(in srgb, ${fg} 8%, transparent), 0 22px 40px -16px rgba(0,0,0,0.45)`,
        }}
      />
      <div className="relative z-10 flex flex-col h-full px-3.5 pt-4 pb-0">
        {children}
      </div>
    </div>
  );
}

function Eyebrow({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="relative z-10 text-[6.5px] uppercase tracking-[0.22em] font-semibold inline-flex items-center gap-1"
      style={{ color, fontFamily: "var(--font-mono)" }}
    >
      <span className="block w-2 h-px" style={{ background: color }} />
      {children}
    </span>
  );
}

function SubLine({ fg, children }: { fg: string; children: React.ReactNode }) {
  return (
    <p
      className="relative z-10 text-[7px] mt-1.5 max-w-[90%] leading-snug"
      style={{
        color: `color-mix(in srgb, ${fg} 70%, transparent)`,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </p>
  );
}

/**
 * Embedded phone preview. The PNG already includes an iPhone device
 * frame + status bar + screen contents — we just clip the bottom 35%
 * of it to fake the "peeks above the fold" effect inside the marketing
 * comp.
 */
function PreviewInset({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative z-10 mt-auto -mb-[1px] w-[68%] mx-auto pointer-events-none aspect-[9/8] overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 639px) 220px, (max-width: 1024px) 180px, 220px"
        className="object-cover object-top select-none"
        draggable={false}
        priority={false}
      />
    </div>
  );
}
