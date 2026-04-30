"use client";

import { useEffect, useReducer, useRef } from "react";

/**
 * Hero headline (top of fold) + a separate `HeroSurfaceRotator` chip
 * exported below for placement under the CTAs. The rotator used to
 * sit between the headline and the subhead, but per UX audit pass 2
 * (P2 #11) it crammed power-user metadata into the most valuable
 * real estate. New layout: headline → subhead → CTAs → trust line →
 * rotator chip (low-noise "+ also generates" reminder).
 */

const SURFACES: { label: string; spec: string }[] = [
  { label: "Web hero shots",         spec: "1920×1080 / 2880×1620" },
  { label: "Press kits",             spec: "ZIP · brand assets"    },
  { label: "Open Graph cards",       spec: "1200×630"              },
  { label: "Discord banners",        spec: "1920×640"              },
  { label: "Product Hunt galleries", spec: "1270×760 × 8"          },
  { label: "GitHub social cards",    spec: "1280×640"              },
];

const INTERVAL_MS = 3200;

export function HeroRotatingTitle() {
  return (
    <h1 className="t-display t-h-1 break-words">
      Ship App Store
      <br />
      <span className="text-[var(--accent)]">screenshots</span>
      <br />
      before coffee.
    </h1>
  );
}

export function HeroSurfaceRotator() {
  const [idx, tick] = useReducer((s: number) => (s + 1) % SURFACES.length, 0);
  const paused      = useRef(false);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const t = setInterval(() => {
      if (!paused.current) tick();
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  const current = SURFACES[idx]!;

  return (
    <div
      className="inline-flex items-center gap-2.5 self-start max-w-full t-mono-xs"
      onMouseEnter={() => { paused.current = true;  }}
      onMouseLeave={() => { paused.current = false; }}
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-1.5 text-[var(--fg-mute)] uppercase tracking-[0.16em] shrink-0">
        <span className="block w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
        + Also exports
      </span>
      <span
        key={idx}
        className="hero-rot inline-flex items-baseline gap-2 min-w-0 overflow-hidden"
      >
        <span className="text-[var(--fg)] truncate">{current.label}</span>
        <span className="text-[var(--fg-mute)] tabular-nums hidden sm:inline">
          · {current.spec}
        </span>
      </span>
    </div>
  );
}
