/**
 * iPad silhouette — modern flat-bezel design.
 *
 * Covers every iPad in the catalog: iPad Pro 13″/11″ (M4), iPad Air
 * 13″/11″ (M3), iPad mini 7, iPad 10. All have `topCutout === "none"`
 * and the same modern body language: thin even bezels on all four
 * sides, front camera dot at the top of the bezel, no notch, no home
 * button on the chassis.
 *
 * Catalog devices are all portrait-oriented in their pointSize, so
 * we render portrait. The shape is drawn with a wider aspect ratio
 * than iPhones — `viewBox` is 100×140 vs the iPhones' 100×200 — so
 * the silhouette reads visually distinct in the picker.
 */

import type { SilhouetteProps } from "./types";

export function IpadFlat({ selected = false }: SilhouetteProps) {
  const stroke      = "currentColor";
  const cameraFill  = selected ? "var(--accent)" : "currentColor";
  const cameraOpacity = selected ? 1 : 0.7;

  return (
    <svg
      viewBox="0 0 100 140"
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      role="presentation"
      aria-hidden
      style={{ display: "block" }}
    >
      {/* No prominent side buttons on the picker — iPad volume +
         power + magnetic-Pencil pad are too small at this scale to
         draw without noise. The chassis line + screen + camera dot
         + home indicator carry the silhouette. */}

      {/* Chassis */}
      <rect
        x="3"
        y="2"
        width="94"
        height="136"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        opacity="0.9"
      />

      {/* Inner screen — even thin bezels (~7%) on all four sides. */}
      <rect
        x="8"
        y="9"
        width="84"
        height="120"
        fill="currentColor"
        fillOpacity="0.05"
        stroke={stroke}
        strokeWidth="0.5"
        strokeOpacity="0.4"
      />

      {/* Front-facing camera — single small dot centered on top
         bezel. Modern iPads (10th gen+, Air M3, Pro M4) all moved
         the camera to the long-edge top center for landscape video
         calls; we render portrait here, so it sits centered along
         the top edge. */}
      <circle cx="50" cy="5.5" r="0.9" fill={cameraFill} opacity={cameraOpacity} />

      {/* Home indicator — modern iPads (Pro/Air/mini/10) all have
         it; iPad SE-style hardware home buttons are out of catalog. */}
      <rect
        x="38"
        y="133"
        width="24"
        height="1.2"
        rx="0.6"
        ry="0.6"
        fill={stroke}
        opacity="0.55"
      />
    </svg>
  );
}
