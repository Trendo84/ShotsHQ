/**
 * Device-by-dimension matcher.
 *
 * Reverse lookup: given a PNG's `{ width, height }`, find the device
 * (and the specific Apple-accepted dim) it belongs to. Returns `null`
 * for unrecognised dimensions.
 *
 * Why this exists
 * ---------------
 * The device picker uses `device → screenshotDims` (a known device,
 * what dims it accepts). The Capture intake flow needs the inverse:
 * the user drops a folder of PNGs, we read each PNG's dimensions, and
 * we need to bucket them into device slots automatically. Catalog
 * already has every Apple-accepted dimension on every device, so this
 * is a pure walk-and-match — no new schema, no new state.
 *
 * The catalog allows the same dim to appear on multiple devices (e.g.
 * 1290×2796 is the required dim for iPhone 15/16 Pro Max + Plus and
 * an accepted second dim for 17 Pro Max). `pickDeviceByDimensions`
 * returns the FIRST match (catalog order: newest first), which is
 * the right default for a fresh project. `pickAllMatches` returns
 * every candidate — useful if the UI ever needs to ask "which one?"
 *
 * See also: docs/issues/v1.1-capture-screen-intake.md (if/when filed)
 * and the Capture v1.1 plan that introduced this helper.
 */

import { DEVICES, type Device } from "./catalog";

export type DimensionMatch = {
  device: Device;
  dim:    { w: number; h: number; required?: boolean };
};

export type Dimensions = { width: number; height: number };

/**
 * Find the first device whose `screenshotDims` accepts `{w, h}`.
 * Returns `null` for unrecognised dimensions.
 *
 * The catalog is iterated in declaration order (newest devices first
 * within each family — see `lib/devices/catalog.ts` ordering rules).
 * This means the matcher prefers current-generation devices when a
 * dim is shared. Predictable + intentional.
 */
export function pickDeviceByDimensions(d: Dimensions): DimensionMatch | null {
  if (!Number.isFinite(d.width) || !Number.isFinite(d.height)) return null;
  if (d.width <= 0 || d.height <= 0) return null;

  for (const device of DEVICES) {
    for (const dim of device.screenshotDims) {
      if (dim.w === d.width && dim.h === d.height) {
        return { device, dim };
      }
    }
  }
  return null;
}

/**
 * Return every device whose `screenshotDims` accepts `{w, h}`. Useful
 * when one PNG dim is valid for multiple devices and the UI wants to
 * surface the ambiguity (e.g. the user explicitly targeted only one
 * of the candidates and we should bucket there).
 *
 * Order matches catalog declaration order.
 */
export function pickAllMatches(d: Dimensions): DimensionMatch[] {
  if (!Number.isFinite(d.width) || !Number.isFinite(d.height)) return [];
  if (d.width <= 0 || d.height <= 0) return [];

  const out: DimensionMatch[] = [];
  for (const device of DEVICES) {
    for (const dim of device.screenshotDims) {
      if (dim.w === d.width && dim.h === d.height) {
        out.push({ device, dim });
        break; // one entry per device even if it lists the dim twice
      }
    }
  }
  return out;
}

export type BucketingSummary = {
  /** deviceId → number of PNGs that bucketed there. */
  byDevice: Map<string, number>;
  /** Count of PNGs whose dimensions matched no catalog device. */
  unmatched: number;
};

/**
 * Aggregate `pickDeviceByDimensions` over a batch of files. Used by
 * the Capture preview UI to render
 *   "12 → iPhone 17 Pro Max ✓ · 8 → iPad Pro 13 ✓ · 1 → unrecognized ⚠".
 *
 * This is the only place the dropzone needs counts — everything else
 * is a per-file decision made via `pickDeviceByDimensions`.
 */
export function summarizeBucketing(files: Dimensions[]): BucketingSummary {
  const byDevice  = new Map<string, number>();
  let   unmatched = 0;

  for (const file of files) {
    const match = pickDeviceByDimensions(file);
    if (!match) {
      unmatched += 1;
      continue;
    }
    const prev = byDevice.get(match.device.id) ?? 0;
    byDevice.set(match.device.id, prev + 1);
  }

  return { byDevice, unmatched };
}
