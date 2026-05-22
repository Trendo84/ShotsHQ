import { z } from "zod";
import type { DeviceId } from "@/lib/canvas/schema";
import { defaultCanvas } from "@/lib/canvas/defaults";
import { validateShotsCanvas } from "@/lib/canvas/schema";
import type { StudioDesign, StudioDesignSet } from "@/components/studio/types";
import { cloneStudioDesign, defaultStudioDesignSet } from "@/components/studio/types";

const deviceIdSchema = z.enum(["iphone_69", "iphone_67", "ipad_13"]);
const backgroundKindSchema = z.enum(["solid", "linear", "radial"]);
const layoutSchema = z.enum(["text-top", "text-bottom", "device-only", "device-angled"]);
const alignSchema = z.enum(["left", "center", "right"]);
const fontFamilySchema = z.enum(["display", "sans", "mono"]);

const studioDesignSchema: z.ZodType<StudioDesign> = z.object({
  panelId: z.string(),
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

const studioDesignSetSchema: z.ZodType<StudioDesignSet> = z.object({
  version: z.literal("2"),
  activePanelId: z.string(),
  panels: z.array(studioDesignSchema).min(1),
});

function sanitizeStudioDesign(design: StudioDesign): StudioDesign {
  return {
    ...design,
    // Blob URLs are browser-local and meaningless after a reload.
    screenshotUrl: design.screenshotUrl?.startsWith("blob:") ? null : design.screenshotUrl,
  };
}

export function validateStudioDesign(value: unknown): StudioDesign | null {
  const result = studioDesignSchema.safeParse(value);
  return result.success ? sanitizeStudioDesign(result.data) : null;
}

export function validateStudioDesignSet(value: unknown): StudioDesignSet | null {
  const result = studioDesignSetSchema.safeParse(value);
  if (!result.success) return null;
  return {
    ...result.data,
    panels: result.data.panels.map(sanitizeStudioDesign),
  };
}

/**
 * Backward-compatible extractor.
 *
 * Phase B stored `studio` as a single design object. Phase C stores
 * `studio` as `{ version:"2", activePanelId, panels[] }`. This reader
 * accepts both and normalizes to the set form.
 */
export function extractStudioDesignSet(value: unknown): StudioDesignSet | null {
  if (!value || typeof value !== "object") return null;
  const studio = (value as Record<string, unknown>).studio;
  const set = validateStudioDesignSet(studio);
  if (set) return set;

  const legacy = validateStudioDesign(studio);
  if (legacy) {
    const panel = legacy.panelId ? legacy : cloneStudioDesign(legacy);
    return {
      version: "2",
      activePanelId: panel.panelId,
      panels: [panel],
    };
  }
  return null;
}

/**
 * Phase B compatibility helper. Callers expecting one panel can still use it.
 */
export function extractStudioDesign(value: unknown): StudioDesign | null {
  return extractStudioDesignSet(value)?.panels[0] ?? null;
}

/**
 * Backward-compatible persistence strategy.
 *
 * We keep the existing top-level ShotsCanvas shape intact so:
 * - legacy Fabric reads still validate
 * - render pipeline still sees a valid ShotsCanvas
 *
 * Studio state rides alongside it as an extra `studio` key.
 */
export function mergeStudioIntoProjectJson(existing: unknown, studio: StudioDesignSet): Record<string, unknown> {
  const firstPanel = studio.panels.find((p) => p.panelId === studio.activePanelId) ?? studio.panels[0]!;
  const canvas = validateShotsCanvas(existing) ?? defaultCanvas(firstPanel.deviceId as DeviceId);
  return {
    ...canvas,
    studio: {
      ...studio,
      panels: studio.panels.map(sanitizeStudioDesign),
    },
  };
}

export function defaultOrExtractStudioDesignSet(value: unknown): StudioDesignSet {
  return extractStudioDesignSet(value) ?? defaultStudioDesignSet();
}
