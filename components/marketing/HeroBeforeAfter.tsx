"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Hero "before / after" composition.
 *
 * Visual proof of the value prop in one glance:
 *   LEFT  — raw iOS screenshot (clipped to a small phone frame).
 *           This is what the user uploads.
 *   RIGHT — full ShotsHQ hero composite (backdrop + frame + headline).
 *           This is what they get back, ready for App Store.
 *
 * The arrow between them tells the whole story.
 */

export function HeroBeforeAfter({ className = "" }: { className?: string }) {
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
      className={`relative w-full ${className}`}
    >
      {/* Soft accent halo behind the comp */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 60%)",
          opacity: revealed ? 1 : 0,
        }}
      />

      <div className="relative z-10 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.6fr)] gap-3 sm:gap-4 lg:gap-5 items-center">

        {/* ── BEFORE: raw screenshot in a tight phone frame ──────────────── */}
        <figure
          className="relative aspect-[9/19.5] transition-all duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform"
          style={{
            transform: revealed ? "translateY(0) rotate(-3deg)" : "translateY(40px) rotate(-8deg)",
            opacity:   revealed ? 1 : 0,
          }}
        >
          <span className="absolute -top-9 left-0 inline-flex items-center gap-2 px-2 py-1 border border-[var(--line-strong)] bg-[var(--bg)] t-mono-xs uppercase tracking-[0.18em] text-[var(--fg)] whitespace-nowrap">
            <span className="block w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            <span className="text-[12px]">Raw input</span>
          </span>

          {/* Phone frame */}
          <div className="relative w-full h-full overflow-hidden border border-[color-mix(in_srgb,var(--fg)_18%,transparent)] bg-[#0A0A0E] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)]"
               style={{ borderRadius: "18%/8.5%" }}>
            {/* Dynamic island */}
            <span
              aria-hidden
              className="absolute left-1/2 -translate-x-1/2 top-[3%] block z-10"
              style={{ width: "32%", height: "3.5%", background: "#000", borderRadius: "999px" }}
            />
            <Image
              src="/showcase/miki-stations.png"
              alt="Raw iOS screenshot before ShotsHQ processing"
              fill
              sizes="(max-width: 639px) 30vw, (max-width: 1024px) 18vw, 180px"
              className="object-cover object-top select-none"
              draggable={false}
              priority
            />
          </div>
        </figure>

        {/* ── ARROW with caption ─────────────────────────────────────────── */}
        <div
          className="flex flex-col items-center gap-3 px-2 transition-all duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{
            opacity: revealed ? 1 : 0,
            transitionDelay: "200ms",
          }}
        >
          <span className="t-mono-xs uppercase tracking-[0.18em] text-[var(--fg-mute)]">
            ShotsHQ
          </span>
          <span className="grid place-items-center w-12 h-12 sm:w-14 sm:h-14 border border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] shadow-[0_0_24px_-4px_var(--accent)]">
            <ArrowRight />
          </span>
          <span className="t-mono-xs uppercase tracking-[0.18em] text-[var(--accent)] font-semibold whitespace-nowrap">
            ~ 5 min
          </span>
        </div>

        {/* ── AFTER: full polished ShotsHQ composite ─────────────────────── */}
        <figure
          className="relative aspect-[9/19.5] transition-all duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform"
          style={{
            transform: revealed ? "translateY(0) rotate(2deg)" : "translateY(-30px) rotate(6deg)",
            opacity:   revealed ? 1 : 0,
            transitionDelay: "120ms",
          }}
        >
          <span className="absolute -top-9 right-0 inline-flex items-center gap-2 px-2 py-1 border border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] t-mono-xs uppercase tracking-[0.18em] whitespace-nowrap">
            <span className="text-[12px] font-semibold">Shipped</span>
            <span className="block w-1.5 h-1.5 rounded-full bg-[var(--accent-fg)]" />
          </span>

          <div
            className="relative w-full h-full overflow-hidden shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7),0_8px_16px_-8px_rgba(0,0,0,0.5)] border border-[color-mix(in_srgb,var(--fg)_8%,transparent)]"
          >
            <Image
              src="/showcase/hero-1.png"
              alt="ShotsHQ-processed App Store screenshot, ready for submission"
              fill
              sizes="(max-width: 639px) 50vw, (max-width: 1024px) 30vw, 320px"
              className="object-cover select-none"
              draggable={false}
              priority
            />
          </div>
        </figure>
      </div>
    </div>
  );
}

function ArrowRight() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      aria-hidden
    >
      <path d="M4 12 L20 12" />
      <path d="M14 6 L20 12 L14 18" />
    </svg>
  );
}
