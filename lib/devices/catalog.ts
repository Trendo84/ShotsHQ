/**
 * iOS device catalog — every iPhone & iPad currently on the App Store
 * device matrix as of 2025-Q2. Source-of-truth for:
 *
 *   - the device picker on /projects/new
 *   - the editor's frame chooser
 *   - aspect-ratio math used to lay out screen content
 *   - render dispatch (which physical-pixel screenshots to bake)
 *
 * App Store rules (locked by Apple, do not edit lightly):
 *
 *   - REQUIRED screenshot dims for any iPhone-targeting app: a 6.9″
 *     (1290×2796) **or** a 6.5″ (1242×2688) set.
 *   - REQUIRED for any iPad-targeting app: a 13″ (2064×2752) set.
 *   - All other sizes are derived/scaled from the above.
 *
 * `screenshotDims` records ONLY what App Store Connect will accept
 * for that specific device. `previewAspect` is what we render in-app
 * for the canvas preview (always one of the screenshotDims, just as
 * a `w/h` ratio for CSS).
 */

export type DeviceFamily = "iphone" | "ipad";

export type Device = {
  /** Stable id (used in URLs, project metadata). Never rename. */
  id: string;
  /** Marketing name shown in UI. */
  name: string;
  family: DeviceFamily;
  /** Display class diagonal, in inches. */
  displayInches: number;
  /** Year first released. */
  year: number;
  /** Generation order within family (higher = newer). */
  generation: number;
  /** Pretty short label for chips ("6.9″"). */
  shortSpec: string;
  /** Logical screen pixels — what an app sees. */
  pointSize: { w: number; h: number };
  /** Native physical pixels. */
  pixelSize: { w: number; h: number };
  /** App Store Connect-accepted screenshot dimensions for this device. */
  screenshotDims: Array<{ w: number; h: number; required?: boolean }>;
  /** Has Dynamic Island (vs notch vs neither). */
  topCutout: "island" | "notch" | "none";
  /** Default chassis color used in marketing chips/previews. */
  swatch: string;
  /** Whether this device is in the current Apple lineup. */
  current: boolean;
  /** Whether this device is the App Store *required* size for its family. */
  isStoreRequired: boolean;
  /** Asset path for the device-frame PNG (transparent device chrome). */
  framePng?: string;
};

/**
 * iPhones — newest first within generation, highest tier first within model.
 */
const IPHONES: Device[] = [
  /* ── iPhone 17 family (2025) ──────────────────────────────── */
  {
    id: "iphone-17-pro-max",
    name: "iPhone 17 Pro Max",
    family: "iphone",
    displayInches: 6.9,
    year: 2025,
    generation: 17,
    shortSpec: "6.9″",
    pointSize: { w: 440, h: 956 },
    pixelSize: { w: 1320, h: 2868 },
    screenshotDims: [{ w: 1320, h: 2868, required: true }, { w: 1290, h: 2796 }],
    topCutout: "island",
    swatch: "#3B3B3B",
    current: true,
    isStoreRequired: true,
    framePng: "/device-frames/iphone-17-pro-max.png",
  },
  {
    id: "iphone-17-pro",
    name: "iPhone 17 Pro",
    family: "iphone",
    displayInches: 6.3,
    year: 2025,
    generation: 17,
    shortSpec: "6.3″",
    pointSize: { w: 402, h: 874 },
    pixelSize: { w: 1206, h: 2622 },
    screenshotDims: [{ w: 1320, h: 2868, required: true }],
    topCutout: "island",
    swatch: "#2D2D2D",
    current: true,
    isStoreRequired: false,
    framePng: "/device-frames/iphone-17-pro.png",
  },
  {
    id: "iphone-17-air",
    name: "iPhone 17 Air",
    family: "iphone",
    displayInches: 6.6,
    year: 2025,
    generation: 17,
    shortSpec: "6.6″",
    pointSize: { w: 422, h: 920 },
    pixelSize: { w: 1266, h: 2760 },
    screenshotDims: [{ w: 1320, h: 2868, required: true }],
    topCutout: "island",
    swatch: "#E8E4DD",
    current: true,
    isStoreRequired: false,
    framePng: "/device-frames/iphone-17-air.png",
  },
  {
    id: "iphone-17",
    name: "iPhone 17",
    family: "iphone",
    displayInches: 6.1,
    year: 2025,
    generation: 17,
    shortSpec: "6.1″",
    pointSize: { w: 393, h: 852 },
    pixelSize: { w: 1179, h: 2556 },
    screenshotDims: [{ w: 1320, h: 2868, required: true }],
    topCutout: "island",
    swatch: "#F5E1B8",
    current: true,
    isStoreRequired: false,
    framePng: "/device-frames/iphone-17.png",
  },

  /* ── iPhone 16 family (2024) ──────────────────────────────── */
  {
    id: "iphone-16-pro-max",
    name: "iPhone 16 Pro Max",
    family: "iphone",
    displayInches: 6.9,
    year: 2024,
    generation: 16,
    shortSpec: "6.9″",
    pointSize: { w: 440, h: 956 },
    pixelSize: { w: 1320, h: 2868 },
    screenshotDims: [{ w: 1320, h: 2868 }, { w: 1290, h: 2796, required: true }],
    topCutout: "island",
    swatch: "#3F3A36",
    current: true,
    isStoreRequired: true,
    framePng: "/device-frames/iphone-16-pro-max.png",
  },
  {
    id: "iphone-16-pro",
    name: "iPhone 16 Pro",
    family: "iphone",
    displayInches: 6.3,
    year: 2024,
    generation: 16,
    shortSpec: "6.3″",
    pointSize: { w: 402, h: 874 },
    pixelSize: { w: 1206, h: 2622 },
    screenshotDims: [{ w: 1290, h: 2796, required: true }],
    topCutout: "island",
    swatch: "#3F3A36",
    current: true,
    isStoreRequired: false,
    framePng: "/device-frames/iphone-16-pro.png",
  },
  {
    id: "iphone-16-plus",
    name: "iPhone 16 Plus",
    family: "iphone",
    displayInches: 6.7,
    year: 2024,
    generation: 16,
    shortSpec: "6.7″",
    pointSize: { w: 430, h: 932 },
    pixelSize: { w: 1290, h: 2796 },
    screenshotDims: [{ w: 1290, h: 2796, required: true }],
    topCutout: "island",
    swatch: "#FFD9D2",
    current: true,
    isStoreRequired: false,
    framePng: "/device-frames/iphone-16-plus.png",
  },
  {
    id: "iphone-16",
    name: "iPhone 16",
    family: "iphone",
    displayInches: 6.1,
    year: 2024,
    generation: 16,
    shortSpec: "6.1″",
    pointSize: { w: 393, h: 852 },
    pixelSize: { w: 1179, h: 2556 },
    screenshotDims: [{ w: 1290, h: 2796, required: true }],
    topCutout: "island",
    swatch: "#9DD5D9",
    current: true,
    isStoreRequired: false,
    framePng: "/device-frames/iphone-16.png",
  },
  {
    id: "iphone-16e",
    name: "iPhone 16e",
    family: "iphone",
    displayInches: 6.1,
    year: 2025,
    generation: 16,
    shortSpec: "6.1″",
    pointSize: { w: 393, h: 852 },
    pixelSize: { w: 1170, h: 2532 },
    screenshotDims: [{ w: 1290, h: 2796, required: true }],
    topCutout: "notch",
    swatch: "#1F1F1F",
    current: true,
    isStoreRequired: false,
    framePng: "/device-frames/iphone-16e.png",
  },

  /* ── iPhone 15 family (2023) ──────────────────────────────── */
  {
    id: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    family: "iphone",
    displayInches: 6.7,
    year: 2023,
    generation: 15,
    shortSpec: "6.7″",
    pointSize: { w: 430, h: 932 },
    pixelSize: { w: 1290, h: 2796 },
    screenshotDims: [{ w: 1290, h: 2796, required: true }],
    topCutout: "island",
    swatch: "#3D444A",
    current: false,
    isStoreRequired: false,
    framePng: "/device-frames/iphone-15-pro-max.png",
  },
  {
    id: "iphone-15-pro",
    name: "iPhone 15 Pro",
    family: "iphone",
    displayInches: 6.1,
    year: 2023,
    generation: 15,
    shortSpec: "6.1″",
    pointSize: { w: 393, h: 852 },
    pixelSize: { w: 1179, h: 2556 },
    screenshotDims: [{ w: 1290, h: 2796, required: true }],
    topCutout: "island",
    swatch: "#3D444A",
    current: false,
    isStoreRequired: false,
  },
  {
    id: "iphone-15-plus",
    name: "iPhone 15 Plus",
    family: "iphone",
    displayInches: 6.7,
    year: 2023,
    generation: 15,
    shortSpec: "6.7″",
    pointSize: { w: 430, h: 932 },
    pixelSize: { w: 1290, h: 2796 },
    screenshotDims: [{ w: 1290, h: 2796, required: true }],
    topCutout: "island",
    swatch: "#FFE9D9",
    current: false,
    isStoreRequired: false,
  },
  {
    id: "iphone-15",
    name: "iPhone 15",
    family: "iphone",
    displayInches: 6.1,
    year: 2023,
    generation: 15,
    shortSpec: "6.1″",
    pointSize: { w: 393, h: 852 },
    pixelSize: { w: 1179, h: 2556 },
    screenshotDims: [{ w: 1290, h: 2796, required: true }],
    topCutout: "island",
    swatch: "#FFD9D2",
    current: false,
    isStoreRequired: false,
  },

  /* ── Compact / legacy ─────────────────────────────────────── */
  {
    id: "iphone-se-3",
    name: "iPhone SE (3rd gen)",
    family: "iphone",
    displayInches: 4.7,
    year: 2022,
    generation: 9,
    shortSpec: "4.7″",
    pointSize: { w: 375, h: 667 },
    pixelSize: { w: 750, h: 1334 },
    screenshotDims: [{ w: 1242, h: 2208 }],
    topCutout: "none",
    swatch: "#F2F2F2",
    current: false,
    isStoreRequired: false,
  },
];

/**
 * iPads — newest first.
 */
const IPADS: Device[] = [
  /* ── iPad Pro M4 (2024) ───────────────────────────────────── */
  {
    id: "ipad-pro-13-m4",
    name: "iPad Pro 13″ (M4)",
    family: "ipad",
    displayInches: 13.0,
    year: 2024,
    generation: 7,
    shortSpec: "13″",
    pointSize: { w: 1032, h: 1376 },
    pixelSize: { w: 2064, h: 2752 },
    screenshotDims: [{ w: 2064, h: 2752, required: true }],
    topCutout: "none",
    swatch: "#2A2A2A",
    current: true,
    isStoreRequired: true,
    framePng: "/device-frames/ipad-13-m4.png",
  },
  {
    id: "ipad-pro-11-m4",
    name: "iPad Pro 11″ (M4)",
    family: "ipad",
    displayInches: 11.0,
    year: 2024,
    generation: 7,
    shortSpec: "11″",
    pointSize: { w: 834, h: 1210 },
    pixelSize: { w: 1668, h: 2420 },
    screenshotDims: [{ w: 2064, h: 2752, required: true }],
    topCutout: "none",
    swatch: "#2A2A2A",
    current: true,
    isStoreRequired: false,
  },

  /* ── iPad Air M3 (2025) ───────────────────────────────────── */
  {
    id: "ipad-air-13-m3",
    name: "iPad Air 13″ (M3)",
    family: "ipad",
    displayInches: 13.0,
    year: 2025,
    generation: 7,
    shortSpec: "13″",
    pointSize: { w: 1024, h: 1366 },
    pixelSize: { w: 2048, h: 2732 },
    screenshotDims: [{ w: 2064, h: 2752, required: true }],
    topCutout: "none",
    swatch: "#9DD5D9",
    current: true,
    isStoreRequired: false,
  },
  {
    id: "ipad-air-11-m3",
    name: "iPad Air 11″ (M3)",
    family: "ipad",
    displayInches: 11.0,
    year: 2025,
    generation: 7,
    shortSpec: "11″",
    pointSize: { w: 820, h: 1180 },
    pixelSize: { w: 1640, h: 2360 },
    screenshotDims: [{ w: 2064, h: 2752, required: true }],
    topCutout: "none",
    swatch: "#FFD9D2",
    current: true,
    isStoreRequired: false,
  },

  /* ── iPad mini (A17 Pro, 2024) ────────────────────────────── */
  {
    id: "ipad-mini-7",
    name: "iPad mini (A17 Pro)",
    family: "ipad",
    displayInches: 8.3,
    year: 2024,
    generation: 7,
    shortSpec: "8.3″",
    pointSize: { w: 744, h: 1133 },
    pixelSize: { w: 1488, h: 2266 },
    screenshotDims: [{ w: 2064, h: 2752, required: true }],
    topCutout: "none",
    swatch: "#3F3A36",
    current: true,
    isStoreRequired: false,
  },

  /* ── iPad (10th gen, 2022) ────────────────────────────────── */
  {
    id: "ipad-10",
    name: "iPad (10th gen)",
    family: "ipad",
    displayInches: 10.9,
    year: 2022,
    generation: 10,
    shortSpec: "10.9″",
    pointSize: { w: 820, h: 1180 },
    pixelSize: { w: 1640, h: 2360 },
    screenshotDims: [{ w: 2064, h: 2752, required: true }],
    topCutout: "none",
    swatch: "#FFD9D2",
    current: false,
    isStoreRequired: false,
  },
];

export const DEVICES: Device[] = [...IPHONES, ...IPADS];

export const DEVICES_BY_ID: Record<string, Device> = Object.fromEntries(
  DEVICES.map((d) => [d.id, d]),
);

/** Devices currently sold by Apple. */
export const CURRENT_DEVICES: Device[] = DEVICES.filter((d) => d.current);

/** Just the App Store-required ones (the renders you must ship). */
export const REQUIRED_DEVICES: Device[] = DEVICES.filter((d) => d.isStoreRequired);

/** Default selection for a new project: 6.9", 6.7" iPhone, 13" iPad. */
export const DEFAULT_PROJECT_DEVICES: string[] = [
  "iphone-17-pro-max",
  "iphone-16-plus",
  "ipad-pro-13-m4",
];

/** Aspect-ratio helpers — useful in CSS. */
export function aspectRatio(d: Device): string {
  return `${d.pointSize.w} / ${d.pointSize.h}`;
}

/** Group a device list by family, with newest generation first. */
export function groupByFamily(list: Device[]): Record<DeviceFamily, Device[]> {
  return {
    iphone: list.filter((d) => d.family === "iphone").sort((a, b) => b.year - a.year || b.generation - a.generation),
    ipad:   list.filter((d) => d.family === "ipad").sort((a, b) => b.year - a.year || b.generation - a.generation),
  };
}
