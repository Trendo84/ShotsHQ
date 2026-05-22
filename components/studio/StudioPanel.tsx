"use client";

import * as React from "react";
import { DeviceFrame } from "./DeviceFrame";
import {
  CANVAS_BASE_WIDTH,
  backgroundCss,
  deviceById,
  frameById,
  layoutById,
  type StudioDesign,
} from "./types";

/**
 * Export node for the constrained Screenshot Studio engine.
 *
 * The node renders at a fixed base size whose aspect ratio is locked to the
 * selected device's exact pixel size. Browser export then scales this node up
 * to the target pixel resolution.
 */
export const StudioPanel = React.forwardRef<
  HTMLDivElement,
  {
    design: StudioDesign;
    headline?: string;
    subhead?: string;
  }
>(function StudioPanel({ design, headline, subhead }, ref) {
  const device = deviceById(design.deviceId);
  const layout = layoutById(design.layout);
  const frame = frameById(design.frameId, design.deviceId);

  const baseWidth = CANVAS_BASE_WIDTH;
  const baseHeight = Math.round((baseWidth * device.height) / device.width);

  const fontFamily =
    design.fontFamily === "display"
      ? "var(--font-display)"
      : design.fontFamily === "mono"
        ? "var(--font-mono)"
        : "var(--font-sans)";

  const head = headline ?? design.headline;
  const sub = subhead ?? design.subhead;

  const baseFrac =
    frame.style === "frameless"
      ? 0.92
      : layout.id === "device-only"
        ? (device.family === "ipad" ? 0.84 : 0.78)
        : device.family === "ipad"
          ? 0.74
          : 0.66;
  const deviceWidth = Math.round(baseWidth * baseFrac);

  const textBlock = (key: string, isHead: boolean) => (
    <div
      key={key}
      style={{
        textAlign: design.align,
        color: design.text,
        padding: "0 9%",
        width: "100%",
        fontFamily,
      }}
    >
      {isHead ? (
        <h2
          style={{
            fontSize: design.headlineSize,
            lineHeight: 1.02,
            fontWeight: 900,
            margin: 0,
            whiteSpace: "pre-line",
            letterSpacing: "-0.04em",
            textTransform: "none",
          }}
        >
          {head}
        </h2>
      ) : (
        <p
          style={{
            fontSize: design.subheadSize,
            lineHeight: 1.4,
            margin: 0,
            color: design.accent,
            whiteSpace: "pre-line",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            fontFamily: "var(--font-mono)",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );

  return (
    <div
      ref={ref}
      data-studio-panel
      style={{
        width: baseWidth,
        height: baseHeight,
        background: backgroundCss(design),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent:
          layout.id === "device-only"
            ? "center"
            : layout.textBottom
              ? "flex-start"
              : "flex-end",
        gap: baseHeight * 0.03,
        paddingTop: baseHeight * 0.07,
        paddingBottom: baseHeight * 0.07,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {layout.id !== "device-only" && (
        <div
          style={{
            position: "absolute",
            top: baseHeight * 0.045,
            left: "50%",
            transform: "translateX(-50%)",
            width: 36,
            height: 3,
            background: design.accent,
            opacity: 0.8,
          }}
        />
      )}

      {layout.textTop && textBlock("head", true)}
      {layout.textTop && sub.trim().length > 0 && textBlock("sub", false)}

      <DeviceFrame
        screenshotUrl={design.screenshotUrl}
        remote={design.screenshotRemote}
        width={deviceWidth}
        accent={design.accent}
        frameStyle={frame.style}
        aspect={device.height / device.width}
        island={device.island}
        style={{
          transform: layout.deviceTransform,
          transformOrigin: "center",
        }}
      />

      {layout.textBottom && sub.trim().length > 0 && textBlock("sub-bottom", false)}
    </div>
  );
});
