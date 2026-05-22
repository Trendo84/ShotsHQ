import type { DeviceId } from "@/lib/canvas/schema";

/**
 * ASOForge-style constrained screenshot studio for ShotsHQ.
 *
 * Phase A goal: prove a stronger creative engine can live beside the
 * existing Fabric editor. This file is pure data/types so the preview,
 * export math, and future server renderer all read from the same model.
 */

export type StudioDeviceSize = {
  id: DeviceId;
  label: string;
  width: number;
  height: number;
  shortLabel: string;
  family: "iphone" | "ipad";
  island: boolean;
};

export const DEVICE_SIZES: readonly StudioDeviceSize[] = [
  {
    id: "iphone_69",
    label: 'iPhone 6.9″ · 1290×2796',
    width: 1290,
    height: 2796,
    shortLabel: 'iPhone 6.9″',
    family: "iphone",
    island: true,
  },
  {
    id: "iphone_67",
    label: 'iPhone 6.7″ · 1320×2868',
    width: 1320,
    height: 2868,
    shortLabel: 'iPhone 6.7″',
    family: "iphone",
    island: true,
  },
  {
    id: "ipad_13",
    label: 'iPad 13″ · 2064×2752',
    width: 2064,
    height: 2752,
    shortLabel: 'iPad 13″',
    family: "ipad",
    island: false,
  },
] as const;

export const CANVAS_BASE_WIDTH = 440;
export const DEFAULT_DEVICE_ID: DeviceId = "iphone_69";

export type DeviceFrameStyle = "pro" | "flat" | "frameless" | "tablet";

export type DeviceFrameSpec = {
  id: string;
  label: string;
  style: DeviceFrameStyle;
  hint: string;
  families: Array<"iphone" | "ipad">;
};

export const DEVICE_FRAMES: readonly DeviceFrameSpec[] = [
  {
    id: "pro-device",
    label: "Pro device",
    style: "pro",
    hint: "Dark premium rail · dynamic island",
    families: ["iphone"],
  },
  {
    id: "flat-device",
    label: "Flat device",
    style: "flat",
    hint: "Hard-edge rail · minimal chrome",
    families: ["iphone"],
  },
  {
    id: "frameless",
    label: "Frameless",
    style: "frameless",
    hint: "Full-bleed screenshot focus",
    families: ["iphone", "ipad"],
  },
  {
    id: "tablet-device",
    label: "Tablet device",
    style: "tablet",
    hint: "Flat iPad hardware silhouette",
    families: ["ipad"],
  },
] as const;

export type LayoutPresetId =
  | "text-top"
  | "text-bottom"
  | "device-only"
  | "device-angled";

export type LayoutPreset = {
  id: LayoutPresetId;
  label: string;
  textTop: boolean;
  textBottom: boolean;
  deviceTransform?: string;
};

export const LAYOUT_PRESETS: readonly LayoutPreset[] = [
  { id: "text-top", label: "Text top", textTop: true, textBottom: false },
  { id: "text-bottom", label: "Text bottom", textTop: false, textBottom: true },
  { id: "device-only", label: "Device only", textTop: false, textBottom: false },
  {
    id: "device-angled",
    label: "Angled",
    textTop: true,
    textBottom: false,
    deviceTransform: "perspective(1800px) rotateY(-14deg) rotateX(4deg) rotateZ(-1deg)",
  },
] as const;

export type BackgroundKind = "solid" | "linear" | "radial";

export type ThemePreset = {
  id: string;
  label: string;
  bg: string;
  bg2: string;
  text: string;
  accent: string;
  kind: BackgroundKind;
};

export const THEME_PRESETS: readonly ThemePreset[] = [
  {
    id: "tactical-telemetry",
    label: "Tactical telemetry",
    bg: "#0A0A0A",
    bg2: "#16161A",
    text: "#EAEAEA",
    accent: "#E61919",
    kind: "radial",
  },
  {
    id: "swiss-industrial",
    label: "Swiss industrial",
    bg: "#F4F4F0",
    bg2: "#E7E0D1",
    text: "#111111",
    accent: "#E61919",
    kind: "linear",
  },
  {
    id: "signal-console",
    label: "Signal console",
    bg: "#0B0B0F",
    bg2: "#20170D",
    text: "#F4F1EA",
    accent: "#F5A20A",
    kind: "radial",
  },
  {
    id: "midnight-blue",
    label: "Midnight blue",
    bg: "#0A1422",
    bg2: "#163A67",
    text: "#EAF1FB",
    accent: "#5BA8F5",
    kind: "radial",
  },
] as const;

export type StudioDesign = {
  headline: string;
  subhead: string;
  headlineSize: number;
  subheadSize: number;
  align: "left" | "center" | "right";
  fontFamily: "display" | "sans" | "mono";
  layout: LayoutPresetId;
  themeId: string;
  bg: string;
  bg2: string;
  bgKind: BackgroundKind;
  text: string;
  accent: string;
  screenshotUrl: string | null;
  screenshotRemote: boolean;
  deviceId: DeviceId;
  frameId: string;
};

export function deviceById(id: DeviceId): StudioDeviceSize {
  return DEVICE_SIZES.find((d) => d.id === id) ?? DEVICE_SIZES[0]!;
}

export function layoutById(id: LayoutPresetId): LayoutPreset {
  return LAYOUT_PRESETS.find((l) => l.id === id) ?? LAYOUT_PRESETS[0]!;
}

export function themeById(id: string): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) ?? THEME_PRESETS[0]!;
}

export function frameById(id: string, deviceId: DeviceId = DEFAULT_DEVICE_ID): DeviceFrameSpec {
  const device = deviceById(deviceId);
  const exact = DEVICE_FRAMES.find((f) => f.id === id && f.families.includes(device.family));
  if (exact) return exact;
  return defaultFrameForDevice(deviceId);
}

export function defaultFrameForDevice(deviceId: DeviceId): DeviceFrameSpec {
  const device = deviceById(deviceId);
  if (device.family === "ipad") return DEVICE_FRAMES.find((f) => f.id === "tablet-device") ?? DEVICE_FRAMES[0]!;
  return DEVICE_FRAMES.find((f) => f.id === "pro-device") ?? DEVICE_FRAMES[0]!;
}

export function backgroundCss(design: Pick<StudioDesign, "bg" | "bg2" | "bgKind">): string {
  if (design.bgKind === "solid") return design.bg;
  if (design.bgKind === "linear") return `linear-gradient(180deg, ${design.bg}, ${design.bg2})`;
  return `radial-gradient(circle at 50% 22%, ${design.bg2} 0%, ${design.bg} 72%)`;
}

export function defaultStudioDesign(deviceId: DeviceId = DEFAULT_DEVICE_ID): StudioDesign {
  const theme = THEME_PRESETS[0]!;
  const frame = defaultFrameForDevice(deviceId);
  return {
    headline: "Ship App Store\nscreenshots faster.",
    subhead: "Constrained layout. Exact export dims. Stronger than a blank canvas.",
    headlineSize: 34,
    subheadSize: 15,
    align: "center",
    fontFamily: "display",
    layout: "text-top",
    themeId: theme.id,
    bg: theme.bg,
    bg2: theme.bg2,
    bgKind: theme.kind,
    text: theme.text,
    accent: theme.accent,
    screenshotUrl: null,
    screenshotRemote: false,
    deviceId,
    frameId: frame.id,
  };
}
