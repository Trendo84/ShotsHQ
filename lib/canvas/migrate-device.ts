/**
 * Migrate a ShotsCanvas from one device to another.
 *
 * Audit P1-6: switching from iPhone to iPad in the editor's device
 * panel only changed local UI state — the canvas dimensions, status
 * bar, persisted JSON, and layer positions never updated. Result:
 * the user picked iPad Pro 13", then saw `1290×2796 · IPHONE 69` in
 * the status bar and a phone-sized canvas. This helper produces the
 * new canvas JSON; the editor remounts FabricCanvas against it and
 * the existing save pipeline persists.
 *
 * Layer-position policy
 * ---------------------
 * We **proportionally rescale** every layer's x/y/width by the ratio
 * between old and new dimensions. Rationale:
 *
 *   - For SYSTEM (placeholder) layers, this preserves the
 *     `TEXT_LAYOUT` percentages that `defaultCanvas()` seeded — so
 *     a freshly-defaulted canvas looks identical after a device
 *     swap, just at the new resolution.
 *   - For user-authored layers, this preserves the relative composition.
 *     A headline positioned at 25% from the top on iPhone 6.9" lands
 *     at 25% from the top on iPad 13", which is the most intuitive
 *     behavior for a switch.
 *
 * `fontSize` is scaled by the smaller axis ratio (`min(sx, sy)`) so
 * text doesn't stretch disproportionately when aspect ratio shifts
 * (iPhone is ~9:19.5, iPad ~3:4 — the y-shrink would otherwise blow
 * fonts up too much).
 *
 * If the requested device matches the current one we return the
 * input untouched — same object identity, so React state diff doesn't
 * trigger needless remounts.
 *
 * Pure function. No DOM, no Fabric, no DB. Easy to unit-test.
 */

import type { DeviceId, ShotsCanvas } from "./schema";

const DEVICE_DIMS: Record<DeviceId, { width: number; height: number }> = {
  iphone_69: { width: 1290, height: 2796 },
  iphone_67: { width: 1320, height: 2868 },
  ipad_13:   { width: 2064, height: 2752 },
};

export function dimensionsFor(device: DeviceId): { width: number; height: number } {
  return DEVICE_DIMS[device];
}

export function migrateCanvasToDevice(
  canvas:    ShotsCanvas,
  newDevice: DeviceId,
): ShotsCanvas {
  if (canvas.device === newDevice) return canvas;

  const { width: newW, height: newH } = DEVICE_DIMS[newDevice];
  const sx = newW / canvas.width;
  const sy = newH / canvas.height;
  const fontScale = Math.min(sx, sy);

  return {
    ...canvas,
    device: newDevice,
    width:  newW,
    height: newH,
    layers: canvas.layers.map((layer) => {
      if (layer.kind === "text") {
        return {
          ...layer,
          x:        Math.round(layer.x        * sx),
          y:        Math.round(layer.y        * sy),
          width:    Math.round(layer.width    * sx),
          fontSize: Math.max(8, Math.round(layer.fontSize * fontScale)),
        };
      }
      // app-screenshot (or future layer kinds) — proportional scale on
      // both axes. Aspect ratio of an uploaded screenshot is preserved
      // because (sx, sy) already encode the new canvas aspect; rescaling
      // both dims keeps the same fraction of canvas covered.
      return {
        ...layer,
        x:      Math.round(layer.x      * sx),
        y:      Math.round(layer.y      * sy),
        width:  Math.round(layer.width  * sx),
        height: Math.round(layer.height * sy),
      };
    }),
  };
}
