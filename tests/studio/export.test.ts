import { describe, expect, it } from "vitest";
import { exportName, pixelRatioFor, slug } from "@/components/studio/export";
import { CANVAS_BASE_WIDTH, defaultFrameForDevice, deviceById, frameById, defaultStudioDesign } from "@/components/studio/types";

/**
 * Phase A contract tests for the new Studio engine.
 *
 * We keep them pure: no DOM capture, no html-to-image, just the math / mapping
 * invariants that make exact-pixel export and device/frame fallback reliable.
 */

describe("studio export contract", () => {
  it("computes pixelRatio from exact device width", () => {
    const d = deviceById("iphone_69");
    expect(pixelRatioFor(d)).toBe(d.width / CANVAS_BASE_WIDTH);
  });

  it("uses the exact iPad export width in pixelRatio", () => {
    const d = deviceById("ipad_13");
    expect(pixelRatioFor(d)).toBe(2064 / CANVAS_BASE_WIDTH);
  });

  it("slugifies filenames safely", () => {
    expect(slug("Audit Flow Test")).toBe("audit-flow-test");
    expect(slug("!!!")).toBe("shot");
  });

  it("builds stable export filenames", () => {
    expect(exportName("Audit Flow Test", 'iPhone 6.9″')).toBe("audit-flow-test-iphone-6-9.png");
  });
});

describe("studio frame/device mapping", () => {
  it("defaults iPhone devices to the phone frame", () => {
    expect(defaultFrameForDevice("iphone_69").id).toBe("pro-device");
  });

  it("defaults iPad devices to the tablet frame", () => {
    expect(defaultFrameForDevice("ipad_13").id).toBe("tablet-device");
  });

  it("falls back to a compatible frame when the chosen frame is invalid for the device", () => {
    expect(frameById("tablet-device", "iphone_69").id).toBe("pro-device");
    expect(frameById("pro-device", "ipad_13").id).toBe("tablet-device");
  });

  it("default design starts on the locked iphone_69 class", () => {
    expect(defaultStudioDesign().deviceId).toBe("iphone_69");
  });
});
