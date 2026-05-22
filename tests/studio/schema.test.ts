import { describe, expect, it } from "vitest";
import { defaultCanvas } from "@/lib/canvas/defaults";
import { defaultStudioDesign, defaultStudioDesignSet } from "@/components/studio/types";
import {
  extractStudioDesign,
  extractStudioDesignSet,
  mergeStudioIntoProjectJson,
  validateStudioDesign,
  validateStudioDesignSet,
} from "@/lib/studio/schema";

describe("studio schema persistence", () => {
  it("validates a default studio design", () => {
    expect(validateStudioDesign(defaultStudioDesign())).not.toBeNull();
  });

  it("validates a default studio design set", () => {
    expect(validateStudioDesignSet(defaultStudioDesignSet())).not.toBeNull();
  });

  it("extracts studio set state from a merged project payload", () => {
    const studio = defaultStudioDesignSet("ipad_13");
    const merged = mergeStudioIntoProjectJson(defaultCanvas("iphone_69"), studio);
    expect(extractStudioDesignSet(merged)?.panels[0]?.deviceId).toBe("ipad_13");
  });

  it("preserves the top-level ShotsCanvas contract while adding studio state", () => {
    const canvas = defaultCanvas("iphone_67");
    const studio = defaultStudioDesignSet("ipad_13");
    const merged = mergeStudioIntoProjectJson(canvas, studio) as Record<string, unknown>;
    expect(merged.device).toBe("iphone_67");
    expect(merged.width).toBe(canvas.width);
    expect(merged.height).toBe(canvas.height);
    expect((merged.studio as { version: string }).version).toBe("2");
  });

  it("falls back to a default canvas when existing payload is null", () => {
    const studio = defaultStudioDesignSet("ipad_13");
    const merged = mergeStudioIntoProjectJson(null, studio);
    expect(merged.device).toBe("ipad_13");
  });

  it("returns null when no studio state exists", () => {
    expect(extractStudioDesign(defaultCanvas())).toBeNull();
    expect(extractStudioDesignSet(defaultCanvas())).toBeNull();
  });

  it("upgrades a legacy single-panel studio payload into a set", () => {
    const legacy = defaultStudioDesign("ipad_13");
    const set = extractStudioDesignSet({ studio: legacy });
    expect(set?.version).toBe("2");
    expect(set?.panels).toHaveLength(1);
    expect(set?.activePanelId).toBe(set?.panels[0]?.panelId);
    expect(set?.panels[0]?.deviceId).toBe("ipad_13");
  });

  it("strips blob screenshot URLs on persistence reads", () => {
    const studio = defaultStudioDesignSet();
    studio.panels[0] = {
      ...studio.panels[0]!,
      screenshotUrl: "blob:http://localhost/test-123",
    };
    const set = validateStudioDesignSet(studio);
    expect(set?.panels[0]?.screenshotUrl).toBeNull();
  });
});
