"use client";

import { type Device, aspectRatio } from "@/lib/devices/catalog";
import { pickSilhouette } from "@/components/devices/silhouettes";

/**
 * Pure-CSS device tile with an SVG silhouette inside.
 *
 * Picker UI surface — used in `/projects/new` Step 01 + the editor's
 * Device Frame tool tab + project cards + thumbnails. NOT the
 * export-render bezel (that's `lib/render/iphone-frame.ts`, separate
 * concern).
 *
 * Silhouette family is picked by `pickSilhouette(device)` from the
 * catalog's `(family, topCutout)` pair. Four families cover the full
 * catalog: iPhone Dynamic Island, iPhone notch, iPhone home button,
 * iPad flat. See `components/devices/silhouettes/index.ts` for the
 * decision tree + `tests/devices/silhouette-pick.test.ts` for the
 * contract test.
 *
 * Selected state: scale-105 + accent ring around the chassis +
 * accent fill on the silhouette's cutout (Dynamic Island / notch /
 * home button / iPad camera). Unselected uses theme-neutral strokes
 * via `currentColor` so both Tactical and Swiss themes inherit
 * automatically.
 *
 * See docs/audits/2026-05-01-internal-team-editor-viewport.md → #2.
 */
export function DeviceTile({
  device,
  selected = false,
  size = "md",
  showName = true,
  className = "",
}: {
  device: Device;
  selected?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}) {
  const widthClass = {
    xs: "w-12",
    sm: "w-16",
    md: "w-24",
    lg: "w-32",
  }[size];

  const Silhouette = pickSilhouette(device);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`relative shrink-0 ${widthClass} transition-transform ${
          selected ? "scale-105" : ""
        }`}
        style={{ aspectRatio: aspectRatio(device) }}
      >
        {/* Chassis fill — sits behind the silhouette so the swatch
           color shows through the SVG's transparent strokes. */}
        <div
          className="absolute inset-0 transition-shadow"
          style={{
            background: device.swatch,
            boxShadow: selected
              ? `0 0 0 2px var(--accent), 0 8px 24px -8px rgba(0,0,0,0.5)`
              : `0 0 0 1px color-mix(in srgb, var(--fg) 30%, transparent), 0 4px 12px -4px rgba(0,0,0,0.4)`,
            // Rigid 90° corners per brand — silhouette inherits.
            borderRadius: 0,
          }}
        />

        {/* Silhouette overlay — fills the chassis. The silhouette
           components use `currentColor` for strokes so they inherit
           the picker's text color. We pick a stroke color that reads
           against the device's swatch: dark strokes on light
           swatches, light strokes on dark swatches.

           The CSS variable `--fg` already adapts to the theme
           background, so using it via the parent's text color gives
           Tactical (light fg on dark) and Swiss (dark fg on light)
           the right read. The `mix-blend-difference` on the
           silhouette layer would also work but creates an extra
           compositing layer and reads "designy" rather than
           "schematic". A `text-[var(--fg)]` parent + `currentColor`
           SVG strokes is simpler. */}
        <div
          className="absolute inset-0 text-[var(--fg)]"
          style={{ opacity: 0.85 }}
          aria-hidden
        >
          <Silhouette selected={selected} />
        </div>
      </div>
      {showName && (
        <div className="text-center min-w-0 max-w-full">
          <div className="text-[11px] font-semibold text-[var(--fg)] truncate" title={device.name}>
            {device.name}
          </div>
          <div className="text-[10px] text-[var(--fg-dim)] tabular-nums">
            {device.shortSpec} · {device.year}
          </div>
        </div>
      )}
    </div>
  );
}
