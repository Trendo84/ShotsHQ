import { describe, expect, it } from "vitest";
import { defaultCanvas } from "@/lib/canvas/defaults";
import { defaultStudioDesign } from "@/components/studio/types";
import { extractStudioDesign, mergeStudioIntoProjectJson, validateStudioDesign } from "@/lib/studio/schema";

describe("studio schema persistence", () => {
  it("validates a default studio design", () => {
    expect(validateStudioDesign(defaultStudioDesign())).not.toBeNull();
  });

  it("extracts studio state from a merged project payload", () => {
    const studio = defaultStudioDesign("ipad_13");
    const merged = mergeStudioIntoProjectJson(defaultCanvas("iphone_69"), studio);
    expect(extractStudioDesign(merged)?.deviceId).toBe("ipad_13");
  });

  it("preserves the top-level ShotsCanvas contract while adding studio state", () => {
    const canvas = defaultCanvas("iphone_67");
    const studio = defaultStudioDesign("ipad_13");
    const merged = mergeStudioIntoProjectJson(canvas, studio) as Record<string, unknown>;
    expect(merged.device).toBe("iphone_67");
    expect(merged.width).toBe(canvas.width);
    expect(merged.height).toBe(canvas.height);
    expect((merged.studio as { deviceId: string }).deviceId).toBe("ipad_13");
  });

  it("falls back to a default canvas when existing payload is null", () => {
    const studio = defaultStudioDesign("ipad_13");
    const merged = mergeStudioIntoProjectJson(null, studio);
    expect(merged.device).toBe("ipad_13");
  });

  it("returns null when no studio state exists", () => {
    expect(extractStudioDesign(defaultCanvas())).toBeNull();
  });
});
