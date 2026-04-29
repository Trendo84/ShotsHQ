/** App Store required dimensions, locked by Apple. */

export const STORE_DIMENSIONS = {
  iphone_69: { width: 1290, height: 2796, label: "iPhone 6.9″ (16 Pro Max)" },
  iphone_67: { width: 1320, height: 2868, label: "iPhone 6.7″ (15 Pro Max)" },
  ipad_13:   { width: 2064, height: 2752, label: "iPad 13″ (M4)" },
} as const;

export type StoreTarget = keyof typeof STORE_DIMENSIONS;
