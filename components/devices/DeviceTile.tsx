"use client";

import { type Device, aspectRatio } from "@/lib/devices/catalog";

/**
 * Pure-CSS device silhouette. We don't load PNG frames here — that's
 * for the renderer. This component is for picker UI, project cards,
 * editor thumbnails. It should look like the device but be fast,
 * theme-aware, and accessible.
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

  const isiPad = device.family === "ipad";
  const cornerRadius = isiPad ? "0" : "0"; // rigid 90° per brand

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`relative shrink-0 ${widthClass} transition-transform ${
          selected ? "scale-105" : ""
        }`}
        style={{ aspectRatio: aspectRatio(device) }}
      >
        {/* Device shell */}
        <div
          className="absolute inset-0 transition-shadow"
          style={{
            background: device.swatch,
            boxShadow: selected
              ? `0 0 0 2px var(--accent), 0 8px 24px -8px rgba(0,0,0,0.5)`
              : `0 0 0 1px color-mix(in srgb, var(--fg) 30%, transparent), 0 4px 12px -4px rgba(0,0,0,0.4)`,
            borderRadius: cornerRadius,
          }}
        />
        {/* Screen inset */}
        <div
          className="absolute"
          style={{
            inset: isiPad ? "6%" : "4%",
            background: "var(--bg)",
            border: "1px solid color-mix(in srgb, var(--fg) 12%, transparent)",
          }}
        >
          {/* Top cutout */}
          {device.topCutout === "island" && (
            <span
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: "3%",
                width: "30%",
                height: "5%",
                background: "#000",
                borderRadius: 9999,
              }}
              aria-hidden
            />
          )}
          {device.topCutout === "notch" && (
            <span
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: 0,
                width: "40%",
                height: "5%",
                background: "#000",
                borderBottomLeftRadius: 6,
                borderBottomRightRadius: 6,
              }}
              aria-hidden
            />
          )}
          {/* Home indicator */}
          {!isiPad && (
            <span
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: "2%",
                width: "30%",
                height: "1.5%",
                background: "var(--fg)",
                opacity: 0.5,
                borderRadius: 9999,
              }}
              aria-hidden
            />
          )}
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
