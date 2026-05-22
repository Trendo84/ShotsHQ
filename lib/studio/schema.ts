import { z } from "zod";
import type { DeviceId } from "@/lib/canvas/schema";
import { defaultCanvas } from "@/lib/canvas/defaults";
import { validateShotsCanvas } from "@/lib/canvas/schema";
import type { StudioDesign } from "@/components/studio/types";

const deviceIdSchema = z.enum(["iphone_69", "iphone_67", "ipad_13"]);
const backgroundKindSchema = z.enum(["solid", "linear", "radial"]);
const layoutSchema = z.enum(["text-top", "text-bottom", "device-only", "device-angled"]);
const alignSchema = z.enum(["left", "center", "right"]);
const fontFamilySchema = z.enum(["display", "sans", "mono"]);

const studioDesignSchema: z.ZodType<StudioDesign> = z.object({
  headline: z.string(),
  subhead: z.string(),
  headlineSize: z.number().int().min(16).max(80),
  subheadSize: z.number().int().min(10).max(32),
  align: alignSchema,
  fontFamily: fontFamilySchema,
  layout: layoutSchema,
  themeId: z.string(),
  bg: z.string(),
  bg2: z.string(),
  bgKind: backgroundKindSchema,
  text: z.string(),
  accent: z.string(),
  screenshotUrl: z.string().nullable(),
  screenshotRemote: z.boolean(),
  deviceId: deviceIdSchema,
  frameId: z.string(),
});

export function validateStudioDesign(value: unknown): StudioDesign | null {
  const result = studioDesignSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function extractStudioDesign(value: unknown): StudioDesign | null {
  if (!value || typeof value !== "object") return null;
  const studio = (value as Record<string, unknown>).studio;
  return validateStudioDesign(studio);
}

/**
 * Backward-compatible persistence strategy for Phase B.
 *
 * We keep the existing top-level ShotsCanvas shape intact so:
 * - legacy Fabric reads still validate
 * - render pipeline still sees a valid ShotsCanvas
 *
 * Studio state rides alongside it as an extra `studio` key.
 */
export function mergeStudioIntoProjectJson(existing: unknown, studio: StudioDesign): Record<string, unknown> {
  const canvas = validateShotsCanvas(existing) ?? defaultCanvas(studio.deviceId as DeviceId);
  return {
    ...canvas,
    studio,
  };
}
