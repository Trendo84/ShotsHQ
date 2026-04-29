"use client";

import { useEffect, useReducer, useRef } from "react";

/**
 * Rotating headline for the hero. Keeps the structural rhythm:
 *
 *   Ship [MODIFIER]            ← line 1 (rotates, default fg)
 *   [NOUN]                     ← line 2 (rotates, accent color)
 *   before coffee.             ← line 3 (stable)
 *
 * Communicates that ShotsHQ ships more than App Store screenshots —
 * press kits, web heroes, OG cards, Discord banners, etc. Cycles every
 * ~3.5s with a soft fade-up transition. Pauses on hover. Honors
 * `prefers-reduced-motion`.
 */

const SURFACES: { modifier: string; noun: string }[] = [
  { modifier: "App Store",     noun: "screenshots"   },
  { modifier: "Web hero",      noun: "sections"      },
  { modifier: "Press",         noun: "kit assets"    },
  { modifier: "Open Graph",    noun: "share cards"   },
  { modifier: "Discord",       noun: "banners"       },
  { modifier: "Product Hunt",  noun: "launch art"    },
  { modifier: "GitHub",        noun: "social cards"  },
];

const INTERVAL_MS = 3200;

export function HeroRotatingTitle() {
  const [idx, tick] = useReducer((s: number) => (s + 1) % SURFACES.length, 0);
  const paused      = useRef(false);

  useEffect(() => {
    const reduced = typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // hold on first item

    const t = setInterval(() => {
      if (!paused.current) tick();
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  const current = SURFACES[idx]!;

  return (
    <h1
      className="t-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.92] text-balance"
      onMouseEnter={() => { paused.current = true;  }}
      onMouseLeave={() => { paused.current = false; }}
      aria-live="polite"
    >
      <span className="block">
        <span>Ship&nbsp;</span>
        {/* Modifier — wraps the rotating non-accent word(s) */}
        <RotatingPhrase
          phrase={current.modifier}
          idx={idx}
          mode="modifier"
        />
      </span>
      <span className="block text-[var(--accent)]">
        {/* Noun — rotating accent word */}
        <RotatingPhrase
          phrase={current.noun}
          idx={idx}
          mode="noun"
        />
      </span>
      <span className="block">before&nbsp;coffee.</span>
    </h1>
  );
}

/**
 * Inline rotating phrase. Rendered as an inline-block so the parent line
 * still flows like normal text. Uses a `key` to remount the span and
 * play the fade-in animation each rotation.
 */
function RotatingPhrase({
  phrase,
  idx,
  mode,
}: {
  phrase: string;
  idx:    number;
  mode:   "modifier" | "noun";
}) {
  return (
    <span
      key={`${mode}-${idx}`}
      className="hero-rot inline-block whitespace-nowrap will-change-[transform,opacity]"
    >
      {phrase}
    </span>
  );
}
