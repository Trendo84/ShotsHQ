/**
 * iPhone with Dynamic Island silhouette.
 *
 * Covers the modern Pro / non-Pro iPhone family: iPhone 15/16/17 Pro
 * Max, Pro, Plus, Air, and base models — anything with
 * `topCutout === "island"` in the catalog.
 *
 * Schematic / line-art treatment, not skeuomorphic. Strokes via
 * `currentColor` so the parent controls line color through Tailwind
 * text utilities. Selected state uses `var(--accent)` for the island
 * cutout fill so the picker's selected tile reads with the brand
 * accent (red TACTICAL / archetype-tinted Swiss).
 *
 * Picker-only — the export-render bezel is a separate concern in
 * `lib/render/iphone-frame.ts`.
 */

import type { SilhouetteProps } from "./types";

export function IphoneDynamicIsland({ selected = false }: SilhouetteProps) {
  // Stroke palette — kept in CSS variables so the silhouette inherits
  // both Tactical and Swiss themes without a re-export.
  const stroke   = "currentColor";
  const islandFill = selected ? "var(--accent)" : "currentColor";
  const islandOpacity = selected ? 1 : 0.85;

  return (
    <svg
      viewBox="0 0 100 200"
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      role="presentation"
      aria-hidden
      style={{ display: "block" }}
    >
      {/* Side buttons — drawn first so the chassis covers their inner edge. */}
      {/* Action button (left) */}
      <rect x="0.5" y="38" width="2" height="10" fill={stroke} opacity="0.7" />
      {/* Volume up + down (left, lower) */}
      <rect x="0.5" y="55" width="2" height="14" fill={stroke} opacity="0.7" />
      <rect x="0.5" y="74" width="2" height="14" fill={stroke} opacity="0.7" />
      {/* Power (right) */}
      <rect x="97.5" y="58" width="2" height="22" fill={stroke} opacity="0.7" />

      {/* Chassis — outer rectangle with rigid 90° corners per brand. */}
      <rect
        x="3"
        y="2"
        width="94"
        height="196"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        opacity="0.9"
      />

      {/* Inner screen bezel — the dark area where content lives. */}
      <rect
        x="6"
        y="5"
        width="88"
        height="190"
        fill="currentColor"
        fillOpacity="0.05"
        stroke={stroke}
        strokeWidth="0.5"
        strokeOpacity="0.4"
      />

      {/* Dynamic Island — pill cutout, centered horizontally near top. */}
      <rect
        x="38"
        y="9"
        width="24"
        height="6"
        rx="3"
        ry="3"
        fill={islandFill}
        opacity={islandOpacity}
      />

      {/* Home indicator — pill at bottom, visible on all modern iPhones. */}
      <rect
        x="35"
        y="190"
        width="30"
        height="1.2"
        rx="0.6"
        ry="0.6"
        fill={stroke}
        opacity="0.55"
      />
    </svg>
  );
}
