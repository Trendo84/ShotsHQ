/**
 * iPhone with notch silhouette.
 *
 * Covers the lone `topCutout === "notch"` case in the catalog: iPhone
 * 16e. The notch is wider than the Dynamic Island, rectangular with
 * bottom-rounded corners, and flush against the top edge of the
 * display.
 *
 * Side-button arrangement is older (no Action button): power on the
 * right, volume up + down on the left only.
 */

import type { SilhouetteProps } from "./types";

export function IphoneNotch({ selected = false }: SilhouetteProps) {
  const stroke      = "currentColor";
  const notchFill   = selected ? "var(--accent)" : "currentColor";
  const notchOpacity = selected ? 1 : 0.85;

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
      {/* Volume up + down (left) — no action button on 16e */}
      <rect x="0.5" y="50" width="2" height="14" fill={stroke} opacity="0.7" />
      <rect x="0.5" y="69" width="2" height="14" fill={stroke} opacity="0.7" />
      {/* Power (right) */}
      <rect x="97.5" y="58" width="2" height="22" fill={stroke} opacity="0.7" />

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

      {/* Inner screen bezel */}
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

      {/* Notch — wider than the island, top-flush, only the bottom
         corners are rounded. Drawn as a path because <rect> can't
         round just two corners. */}
      <path
        d="M 32 5
           L 68 5
           L 68 13
           Q 68 16 65 16
           L 35 16
           Q 32 16 32 13
           Z"
        fill={notchFill}
        opacity={notchOpacity}
      />

      {/* Home indicator */}
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
