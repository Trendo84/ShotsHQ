"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { rewriteR2ToProxy } from "@/lib/studio/r2-proxy-url";
import type { DeviceFrameStyle } from "./types";

/**
 * Pure device frame renderer for the Studio engine.
 *
 * This is intentionally decorative only — the export geometry comes from the
 * selected device's exact pixel size. The frame style changes the surround,
 * never the export contract.
 */
export function DeviceFrame({
  screenshotUrl,
  remote,
  width,
  accent,
  frameStyle,
  aspect,
  island,
  className,
  style,
}: {
  screenshotUrl: string | null;
  remote?: boolean;
  width: number;
  accent: string;
  frameStyle: DeviceFrameStyle;
  aspect: number;
  island: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const height = Math.round(width * aspect);

  if (frameStyle === "frameless") {
    const radius = Math.round(width * 0.045);
    return (
      <div
        className={cn("relative shrink-0 overflow-hidden", className)}
        style={{
          width,
          height,
          borderRadius: radius,
          boxShadow: `0 28px 80px -26px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)`,
          ...style,
        }}
      >
        <ScreenContent screenshotUrl={screenshotUrl} remote={remote} accent={accent} />
      </div>
    );
  }

  const isTablet = frameStyle === "tablet";
  const flat = frameStyle === "flat";
  const bezelFactor = isTablet ? 0.034 : flat ? 0.048 : 0.035;
  const bezel = Math.max(7, Math.round(width * bezelFactor));
  const radius = isTablet
    ? Math.round(width * 0.08)
    : flat
      ? Math.round(width * 0.11)
      : Math.round(width * 0.155);
  const screenRadius = Math.max(2, radius - bezel);

  const railBg = isTablet
    ? "linear-gradient(150deg, #D4D7DE 0%, #A6ABB5 32%, #7C818A 62%, #C3C7D0 100%)"
    : flat
      ? "linear-gradient(150deg, #C7C8CC 0%, #8A8B90 30%, #6E6F74 60%, #B4B5BA 100%)"
      : "linear-gradient(150deg, #4A4A52 0%, #1A1A1E 28%, #0C0C0F 60%, #2A2A30 100%)";
  const sideBtn = isTablet ? "#9498A3" : flat ? "#9A9BA0" : "#2A2A30";

  return (
    <div className={cn("relative shrink-0", className)} style={{ width, height, ...style }}>
      <div
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          background: railBg,
          boxShadow: "0 30px 70px -20px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      />
      <div
        className="absolute"
        style={{
          inset: bezel * 0.45,
          borderRadius: radius - bezel * 0.45,
          background: "#050507",
        }}
      />
      <div
        className="absolute overflow-hidden"
        style={{
          inset: bezel,
          borderRadius: screenRadius,
          background: "#0B0B0F",
        }}
      >
        <ScreenContent screenshotUrl={screenshotUrl} remote={remote} accent={accent} />
        {!isTablet && (island ? (
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: Math.round(height * 0.018),
              width: Math.round(width * 0.28),
              height: Math.round(width * 0.082),
              borderRadius: 999,
              background: "#000",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          />
        ) : (
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: 0,
              width: Math.round(width * 0.42),
              height: Math.round(width * 0.07),
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              background: "#000",
            }}
          />
        ))}
      </div>

      {!isTablet && (
        <>
          <div
            className="absolute"
            style={{
              left: -2,
              top: "25%",
              width: 3,
              height: "8%",
              borderRadius: 2,
              background: sideBtn,
            }}
          />
          <div
            className="absolute"
            style={{
              right: -2,
              top: "22%",
              width: 3,
              height: "12%",
              borderRadius: 2,
              background: sideBtn,
            }}
          />
        </>
      )}
    </div>
  );
}

function ScreenContent({
  screenshotUrl,
  remote,
  accent,
}: {
  screenshotUrl: string | null;
  remote?: boolean;
  accent: string;
}) {
  if (!screenshotUrl) return <PlaceholderScreen accent={accent} />;

  // Route remote R2 URLs through our same-origin proxy so the
  // exporter's canvas drawImage doesn't taint on the cross-origin
  // read. The R2 bucket isn't CORS-configured today (cycle #6
  // audit, 2026-05-23). See lib/studio/r2-proxy-url.ts for the
  // rewrite rule + tests, and app/api/r2-proxy/route.ts for the
  // server-side fetch.
  //
  // For non-R2 sources (blob: from a just-dropped file, data:
  // URLs, or future same-origin sources) the helper returns the
  // URL unchanged.
  const renderSrc = remote ? (rewriteR2ToProxy(screenshotUrl) ?? screenshotUrl) : screenshotUrl;

  // Same-origin renders don't need `crossOrigin` and shouldn't set
  // it — the attribute changes cache-key behavior and can cause
  // duplicate fetches. We only retain it for blob: / data: edge
  // cases where `remote` is true but the helper passed the URL
  // through unchanged (shouldn't happen in practice).
  const sameOrigin = renderSrc !== screenshotUrl || !remote;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={renderSrc}
      alt="App screenshot"
      crossOrigin={sameOrigin ? undefined : "anonymous"}
      className="h-full w-full object-cover"
      draggable={false}
    />
  );
}

function PlaceholderScreen({ accent }: { accent: string }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center"
      style={{
        background: "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.05) 0%, #0B0B0F 70%)",
      }}
    >
      <svg width="56" height="56" viewBox="0 0 100 100" aria-hidden="true">
        <rect x="14" y="58" width="18" height="30" rx="4" fill={accent} />
        <rect x="41" y="42" width="18" height="46" rx="4" fill={accent} />
        <rect x="68" y="22" width="18" height="66" rx="4" fill={accent} />
        <path d="M19 58 L77 26" stroke={accent} strokeWidth="6" strokeLinecap="round" opacity="0.85" />
      </svg>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: accent }}>
        Upload screenshot
      </p>
      <p className="font-mono text-[10px] text-white/35">PNG or JPG · exact panel preview</p>
    </div>
  );
}
