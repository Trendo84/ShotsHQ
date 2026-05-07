/** App Store required dimensions, locked by Apple. */

export const STORE_DIMENSIONS = {
  iphone_69: { width: 1290, height: 2796, label: "iPhone 6.9″ (16 Pro Max)" },
  iphone_67: { width: 1320, height: 2868, label: "iPhone 6.7″ (15 Pro Max)" },
  ipad_13:   { width: 2064, height: 2752, label: "iPad 13″ (M4)" },
} as const;

export type StoreTarget = keyof typeof STORE_DIMENSIONS;

/**
 * Reverse lookup: given an exact `{ width, height }`, return the
 * matching `StoreTarget` enum value or `null` if the dimensions
 * don't correspond to any App Store-required class.
 *
 * Used by the Capture intake flow to bucket dropped PNGs into the
 * three database `device` enum values. The device-level catalog
 * matcher (`lib/devices/match.ts`) returns a marketing Device (e.g.
 * "iPhone 17 Pro Max"); this helper is the narrower DB-class form.
 */
export function findStoreTargetByDimensions(
  d: { width: number; height: number },
): StoreTarget | null {
  if (!Number.isFinite(d.width) || !Number.isFinite(d.height)) return null;
  for (const [key, val] of Object.entries(STORE_DIMENSIONS) as Array<
    [StoreTarget, (typeof STORE_DIMENSIONS)[StoreTarget]]
  >) {
    if (val.width === d.width && val.height === d.height) return key;
  }
  return null;
}
