"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Interactive before / after image-comparison slider for the hero.
 *
 * Drag the divider left to reveal more of the raw screenshot; right to
 * reveal more of the polished ShotsHQ output. Same image dimensions
 * (1290 × 2796) so the comparison is direct.
 *
 * Pointer events handle mouse + touch through one unified path.
 * Position state updates inside requestAnimationFrame to keep the
 * handle locked to the cursor without scheduler jitter.
 */
export function HeroBeforeAfterSlider({ className = "" }: { className?: string }) {
  const wrap   = useRef<HTMLDivElement | null>(null);
  const drag   = useRef(false);
  const rafId  = useRef<number | null>(null);
  const lastX  = useRef<number>(0);

  const [pos, setPos] = useState(50); // 0-100, percentage of width revealing the AFTER image

  // ── Pointer math ────────────────────────────────────────────────────────────
  const apply = useCallback(() => {
    rafId.current = null;
    if (!wrap.current) return;
    const rect = wrap.current.getBoundingClientRect();
    const x    = ((lastX.current - rect.left) / rect.width) * 100;
    setPos(Math.max(2, Math.min(98, x))); // small inset so the handle never clips out of frame
  }, []);

  const schedule = useCallback((clientX: number) => {
    lastX.current = clientX;
    if (rafId.current === null) rafId.current = requestAnimationFrame(apply);
  }, [apply]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    drag.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    schedule(e.clientX);
  }, [schedule]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return;
    e.preventDefault();
    schedule(e.clientX);
  }, [schedule]);

  const onPointerUp = useCallback(() => {
    drag.current = false;
  }, []);

  // ── Auto-demo on first reveal ───────────────────────────────────────────────
  // Show the user the slider works by sweeping it once when it scrolls into view.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const node = wrap.current;
    if (!node) return;

    let played = false;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !played) {
            played = true;
            obs.unobserve(e.target);

            // Sweep: 50 → 25 → 75 → 50 over ~2.4s, then stay at 50.
            const start    = performance.now();
            const duration = 2400;
            const tick = (now: number) => {
              if (drag.current) return; // user took over — abort the demo
              const t = Math.min(1, (now - start) / duration);
              // Smoothstep ramps for the three legs of the sweep
              let next = 50;
              if      (t < 0.33) next = 50 - 25 * (t / 0.33);
              else if (t < 0.66) next = 25 + 50 * ((t - 0.33) / 0.33);
              else               next = 75 - 25 * ((t - 0.66) / 0.34);
              setPos(next);
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={`relative w-full ${className}`}>
      {/* Soft glow behind the comp */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 65%)",
        }}
      />

      {/* Frame */}
      <div
        ref={wrap}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-label="Drag to compare raw screenshot to ShotsHQ output"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft")  setPos((p) => Math.max(2,  p - 4));
          if (e.key === "ArrowRight") setPos((p) => Math.min(98, p + 4));
        }}
        className="relative aspect-[9/19.5] max-w-[420px] mx-auto select-none touch-none cursor-ew-resize overflow-hidden border border-[color-mix(in_srgb,var(--fg)_8%,transparent)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7),0_8px_16px_-8px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {/* AFTER — bottom layer, full width */}
        <Image
          src="/showcase/hero-1.png"
          alt="ShotsHQ-processed App Store screenshot"
          fill
          priority
          sizes="(max-width: 639px) 80vw, (max-width: 1024px) 32vw, 420px"
          className="object-cover select-none pointer-events-none"
          draggable={false}
        />

        {/* BEFORE — clipped from the right by the slider position */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <Image
            src="/showcase/miki-stations.png"
            alt="Raw iOS screenshot"
            fill
            sizes="(max-width: 639px) 80vw, (max-width: 1024px) 32vw, 420px"
            className="object-cover select-none pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Divider line */}
        <div
          aria-hidden
          className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)] pointer-events-none"
          style={{ left: `${pos}%`, transform: "translateX(-1px)" }}
        />

        {/* Handle */}
        <div
          aria-hidden
          className="absolute top-1/2 -translate-y-1/2 grid place-items-center rounded-full bg-white text-[var(--bg)] w-11 h-11 shadow-[0_4px_16px_rgba(0,0,0,0.5)] pointer-events-none"
          style={{ left: `${pos}%`, transform: "translate(-50%, -50%)" }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden>
            <path d="M9 6 L4 12 L9 18" />
            <path d="M15 6 L20 12 L15 18" />
          </svg>
        </div>

        {/* Labels */}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 bg-black/70 text-white t-mono-xs uppercase tracking-[0.16em] backdrop-blur-sm pointer-events-none">
          <span className="block w-1.5 h-1.5 rounded-full bg-white" />
          Raw
        </span>
        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2 py-1 bg-[var(--accent)] text-[var(--accent-fg)] t-mono-xs uppercase tracking-[0.16em] backdrop-blur-sm pointer-events-none">
          Shipped
          <span className="block w-1.5 h-1.5 rounded-full bg-[var(--accent-fg)]" />
        </span>

        {/* Hint at first paint */}
        <span
          aria-hidden
          className="absolute bottom-3 left-1/2 -translate-x-1/2 t-mono-xs uppercase tracking-[0.16em] text-white px-2 py-1 bg-black/60 backdrop-blur-sm pointer-events-none whitespace-nowrap"
        >
          ← Drag to compare →
        </span>
      </div>
    </div>
  );
}
