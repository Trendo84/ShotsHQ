/**
 * Pre-X iPhone silhouette (home button).
 *
 * Covers the `family === "iphone" && topCutout === "none"` case —
 * currently iPhone SE (3rd gen). Thick top + bottom bezels, FaceTime
 * camera dot + speaker grille at the top, circular home button at
 * the bottom. No notch, no Dynamic Island, no home-indicator pill.
 *
 * Side-button arrangement: ring/silent + volume up + volume down
 * on the left, power on the right.
 */

import type { SilhouetteProps } from "./types";

export function IphoneHomeButton({ selected = false }: SilhouetteProps) {
  const stroke         = "currentColor";
  const homeButtonStroke = selected ? "var(--accent)" : "currentColor";
  const homeButtonOpacity = selected ? 1 : 0.7;

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
      {/* Side buttons */}
      {/* Ring/silent switch (left, top) */}
      <rect x="0.5" y="38" width="2" height="6" fill={stroke} opacity="0.7" />
      {/* Volume up + down (left) */}
      <rect x="0.5" y="50" width="2" height="12" fill={stroke} opacity="0.7" />
      <rect x="0.5" y="66" width="2" height="12" fill={stroke} opacity="0.7" />
      {/* Power (right) */}
      <rect x="97.5" y="40" width="2" height="20" fill={stroke} opacity="0.7" />

      {/* Chassis */}
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

      {/* Inner screen — pre-X has thick top + bottom bezels, so the
         display rect is shorter than the chassis. */}
      <rect
        x="8"
        y="22"
        width="84"
        height="156"
        fill="currentColor"
        fillOpacity="0.05"
        stroke={stroke}
        strokeWidth="0.5"
        strokeOpacity="0.4"
      />

      {/* Speaker grille — thin pill above the screen, centered. */}
      <rect
        x="42"
        y="11"
        width="16"
        height="1.4"
        rx="0.7"
        ry="0.7"
        fill={stroke}
        opacity="0.6"
      />
      {/* FaceTime camera — small dot to the right of the grille. */}
      <circle cx="64" cy="11.7" r="1" fill={stroke} opacity="0.6" />

      {/* Home button — concentric circles at the bottom bezel. */}
      <circle
        cx="50"
        cy="187"
        r="6"
        fill="none"
        stroke={homeButtonStroke}
        strokeWidth="1.2"
        opacity={homeButtonOpacity}
      />
      <circle
        cx="50"
        cy="187"
        r="3.5"
        fill="none"
        stroke={homeButtonStroke}
        strokeWidth="0.8"
        opacity={homeButtonOpacity}
      />
    </svg>
  );
}
