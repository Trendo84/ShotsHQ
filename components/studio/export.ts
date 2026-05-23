"use client";

import { toPng } from "html-to-image";
import { CANVAS_BASE_WIDTH, type StudioDeviceSize } from "./types";

/**
 * Exact-pixel export contract.
 *
 * The studio preview node renders at a fixed CSS width
 * (`CANVAS_BASE_WIDTH`). Browser export scales the capture node by
 * `device.width / CANVAS_BASE_WIDTH` via `pixelRatio` to land on the
 * exact integer width the App Store expects (e.g. 1290 px for
 * iPhone 6.9").
 *
 * **Do NOT also pass `canvasWidth` / `canvasHeight`.** `html-to-image`
 * multiplies `canvasWidth` by `pixelRatio` to size the backing
 * canvas, so passing both produces a `device.width * pixelRatio`-wide
 * output (e.g. 3782 px for iPhone 6.9"). Cycle #6 (2026-05-23)
 * caught this — the prior code set both as "belt-and-suspenders"
 * and got double-scaled output. The dim mismatch went unnoticed
 * because the export was simultaneously broken by canvas-taint
 * (no PNG was actually produced); after fixing the taint via the
 * R2 same-origin proxy, the dim bug became loud. Now caught by
 * `e2e/studio-export-loop.spec.ts`.
 *
 * The CSS-pixel size of the node is the source of truth; pixelRatio
 * is the single knob that maps it to App Store pixels.
 */
export function pixelRatioFor(device: StudioDeviceSize): number {
  return device.width / CANVAS_BASE_WIDTH;
}

export async function renderPanelToPng(
  node: HTMLElement,
  device: StudioDeviceSize,
): Promise<string> {
  return toPng(node, {
    pixelRatio: pixelRatioFor(device),
    cacheBust:  true,
    style:      { margin: "0" },
  });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function measurePng(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not decode exported PNG"));
    img.src = dataUrl;
  });
}

export function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "shot"
  );
}

export function exportName(projectName: string, deviceLabel: string): string {
  return `${slug(projectName)}-${slug(deviceLabel)}.png`;
}

export function seqName(index: number, deviceId: string, projectName: string): string {
  const n = String(index).padStart(2, "0");
  return `${n}-${slug(deviceId)}-${slug(projectName)}.png`;
}
