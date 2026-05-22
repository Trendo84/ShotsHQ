"use client";

import { toPng } from "html-to-image";
import { CANVAS_BASE_WIDTH, type StudioDeviceSize } from "./types";

/**
 * Exact-pixel export contract.
 *
 * The studio preview node renders at a fixed CSS width. Browser export scales
 * the capture node by `device.width / CANVAS_BASE_WIDTH`, and we also pass the
 * explicit backing-canvas width/height so the PNG lands on the exact integers
 * App Store Connect expects.
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
    canvasWidth: device.width,
    canvasHeight: device.height,
    cacheBust: true,
    style: { margin: "0" },
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
