"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Three App Store-style screenshot compositions for the hero.
 *
 * Each composition is the actual artifact ShotsHQ produces:
 *   1. A confident colored backdrop with a single decorative motif
 *   2. A bold marketing headline (single typeface, no italic mixing)
 *   3. A real iPhone frame with a real app screenshot inside
 *
 * No fake "PNG inset" tricks. The screenshot is a proper image
 * clipped to a phone-shaped rounded mask. Looks legit because it IS
 * legit.
 */

type Variant = "tactical" | "minimal" | "warm";

type Frame = {
  variant: Variant;
  tilt:    number;
  yOffset: number;
  z:       number;
  enterTilt: number;
};

const FRAMES: Frame[] = [
  { variant: "tactical", tilt: -5, yOffset:  18, z: 20, enterTilt: -14 },
  { variant: "minimal",  tilt:  3, yOffset: -16, z: 30, enterTilt:   0 },
  { variant: "warm",     tilt: -2, yOffset:  10, z: 10, enterTilt:  14 },
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
      { threshold: 0.2 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`relative w-full min-h-[400px] sm:min-h-[520px] flex items-center justify-center ${className}`}
    >
      {/* Soft accent glow behind the cluster */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[80%] pointer-events-none transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 65%)",
          opacity: revealed ? 1 : 0,
        }}
      />

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3 lg:gap-5 items-center w-full max-w-[280px] sm:max-w-[680px]">
        {FRAMES.map((f, i) => {
          const settled = `rotate(${f.tilt}deg) translateY(${f.yOffset}px)`;
          const enter   = `rotate(${f.enterTilt}deg) translateY(${f.yOffset + 32}px)`;
          return (
            <div
              key={f.variant}
              className="group relative transition-all duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] phone-frame-wrap will-change-transform"
              style={{
                transform: revealed ? settled : enter,
                opacity:   revealed ? 1 : 0,
                transitionDelay: `${i * 110}ms`,
                zIndex: f.z,
              }}
            >
              <Composition variant={f.variant} />
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

// ── Compositions ──────────────────────────────────────────────────────────────

const VARIANTS: Record<Variant, {
  bg:        string;
  accent:    string;
  fg:        string;
  headline:  string;
  subhead:   string;
  screenshot: string;
  decor:     "vinyl" | "halftone" | "leaf";
}> = {
  tactical: {
    bg:         "#0A0A0E",
    accent:     "#FF2A2A",
    fg:         "#FFFFFF",
    headline:   "TUNE IN.",
    subhead:    "945 stations. Worldwide.",
    screenshot: "/showcase/miki-stations.png",
    decor:      "vinyl",
  },
  minimal: {
    bg:         "#F4F1EA",
    accent:     "#0A0A0A",
    fg:         "#0A0A0A",
    headline:   "DEEP CUTS.",
    subhead:    "Every album. Every story.",
    screenshot: "/showcase/miki-album.png",
    decor:      "halftone",
  },
  warm: {
    bg:         "#1B3A2F",
    accent:     "#E74C3C",
    fg:         "#F5F0E1",
    headline:   "THE CRATE.",
    subhead:    "Save what you love. Forever.",
    screenshot: "/showcase/miki-crate.png",
    decor:      "leaf",
  },
};

function Composition({ variant }: { variant: Variant }) {
  const v = VARIANTS[variant];
  return (
    <div
      className="relative aspect-[9/19.5] w-full overflow-hidden border border-[color-mix(in_srgb,var(--fg)_8%,transparent)] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]"
      style={{ background: v.bg }}
    >
      <DecorBackground variant={v.decor} accent={v.accent} fg={v.fg} />

      <div className="relative z-10 flex flex-col h-full px-3 pt-4">
        {/* Headline */}
        <h3
          className="leading-[0.92] tracking-[-0.03em] text-[clamp(1.15rem,3vw,1.45rem)]"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            color:      v.fg,
          }}
        >
          {v.headline}
        </h3>
        <p
          className="text-[7.5px] mt-1 leading-snug max-w-[90%]"
          style={{
            color: `color-mix(in srgb, ${v.fg} 65%, transparent)`,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}
        >
          {v.subhead}
        </p>

        {/* Phone frame with real screenshot inside */}
        <div className="relative mt-auto pb-2 flex justify-center">
          <PhoneFrame src={v.screenshot} bg={v.bg} fg={v.fg} alt={v.headline} />
        </div>
      </div>
    </div>
  );
}

/**
 * Inline phone mockup — pure CSS, no PNG. Takes a real screenshot
 * via Next/Image and clips it to a rounded screen rect inside a
 * dark frame with a dynamic island.
 */
function PhoneFrame({ src, bg: _bg, fg, alt }: { src: string; bg: string; fg: string; alt: string }) {
  return (
    <div
      className="relative w-[58%] aspect-[9/19] overflow-hidden"
      style={{
        background: "#0A0A0E",
        borderRadius: "14px",
        boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${fg} 18%, transparent), 0 8px 16px -8px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Dynamic island */}
      <span
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 top-[6px] block"
        style={{
          width:        "32%",
          height:       "5px",
          background:   "#000",
          borderRadius: "3px",
        }}
      />
      {/* Screen */}
      <div
        className="absolute inset-[2px] overflow-hidden"
        style={{ borderRadius: "11px" }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 639px) 160px, 200px"
          className="object-cover object-top select-none"
          draggable={false}
          priority={false}
        />
      </div>
    </div>
  );
}

/** Per-variant decorative background — single confident motif, no clutter. */
function DecorBackground({
  variant,
  accent,
  fg,
}: {
  variant: "vinyl" | "halftone" | "leaf";
  accent: string;
  fg:     string;
}) {
  if (variant === "vinyl") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 100 220"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.55 }}
      >
        <defs>
          <radialGradient id="vinyl-glow" cx="20%" cy="20%" r="60%">
            <stop offset="0%"   stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="220" fill="url(#vinyl-glow)" />
        {/* Vinyl rings */}
        <g stroke={accent} strokeWidth="0.4" fill="none" opacity="0.55">
          <circle cx="-10" cy="220" r="60" />
          <circle cx="-10" cy="220" r="50" />
          <circle cx="-10" cy="220" r="40" />
          <circle cx="-10" cy="220" r="30" />
          <circle cx="-10" cy="220" r="20" />
        </g>
      </svg>
    );
  }
  if (variant === "halftone") {
    return (
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${fg} 0.9px, transparent 1.4px)`,
          backgroundSize: "9px 9px",
          opacity: 0.08,
        }}
      />
    );
  }
  // leaf
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 220"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.5 }}
    >
      <g stroke={accent} strokeWidth="0.6" fill="none" opacity="0.55">
        {/* Curving leaf vein */}
        <path d="M 5 5 Q 50 50, 95 5 T 5 105 Q 50 150, 95 105" />
        <path d="M 95 215 Q 50 170, 5 215 T 95 115 Q 50 70, 5 115" />
      </g>
    </svg>
  );
}
