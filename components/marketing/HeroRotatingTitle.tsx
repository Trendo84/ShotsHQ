"use client";

import { useEffect, useReducer, useRef } from "react";

/**
 * Hero headline + rotating surface chip.
 *
 * The headline stays STATIC ("Ship App Store screenshots before coffee.")
 * so the value prop and SEO title don't drift. A small chip below the
 * subhead rotates through the OTHER surfaces ShotsHQ generates so the
 * "more than App Store" story still gets told without confusing landers.
 */

const SURFACES: { label: string; spec: string }[] = [
  { label: "Web hero shots",      spec: "1920×1080 / 2880×1620"   },
  { label: "Press kits",          spec: "ZIP · brand assets"      },
  { label: "Open Graph cards",    spec: "1200×630"                },
  { label: "Discord banners",     spec: "1920×640"                },
  { label: "Product Hunt galleries", spec: "1270×760 × 8"          },
  { label: "GitHub social cards", spec: "1280×640"                },
];

const INTERVAL_MS = 2800;

export function HeroRotatingTitle() {
  const [idx, tick] = useReducer((s: number) => (s + 1) % SURFACES.length, 0);
  const paused      = useRef(false);

  useEffect(() => {
    const reduced = typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const t = setInterval(() => {
      if (!paused.current) tick();
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  const current = SURFACES[idx]!;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="t-display text-[clamp(2.25rem,7vw,5.5rem)] leading-[0.92] text-balance break-words">
        Ship&nbsp;App&nbsp;Store
        <br />
        <span className="text-[var(--accent)]">screenshots</span>
        <br />
        before&nbsp;coffee.
      </h1>

      {/* Rotating surface chip — communicates 'plus everything else' */}
      <div
        className="inline-flex items-center gap-2.5 self-start max-w-full t-mono-xs"
        onMouseEnter={() => { paused.current = true;  }}
        onMouseLeave={() => { paused.current = false; }}
        aria-live="polite"
      >
        <span className="inline-flex items-center gap-1.5 border border-[var(--line)] px-2 py-1 text-[var(--fg-mute)] uppercase tracking-[0.16em] shrink-0">
          <span className="block w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          + Also generates
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
    </div>
  );
}
