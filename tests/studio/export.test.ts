import { describe, expect, it } from "vitest";
import { exportName, pixelRatioFor, seqName, slug } from "@/components/studio/export";
import {
  CANVAS_BASE_WIDTH,
  cloneStudioDesign,
  defaultFrameForDevice,
  defaultStudioDesign,
  defaultStudioDesignSet,
  deviceById,
  frameById,
} from "@/components/studio/types";

/**
 * Phase C contract tests for the Studio engine.
 *
 * We keep them pure: exact export math, filename sequencing, and the multi-panel
 * data helpers that underpin the filmstrip/bulk-export workflow.
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

  it("builds stable single-export filenames", () => {
    expect(exportName("Audit Flow Test", 'iPhone 6.9″')).toBe("audit-flow-test-iphone-6-9.png");
  });

  it("builds sequential bulk-export filenames", () => {
    expect(seqName(1, "iphone_69", "Audit Flow Test")).toBe("01-iphone-69-audit-flow-test.png");
    expect(seqName(12, "ipad_13", "Audit Flow Test")).toBe("12-ipad-13-audit-flow-test.png");
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

describe("studio panel set helpers", () => {
  it("creates a default set with one active panel", () => {
    const set = defaultStudioDesignSet();
    expect(set.version).toBe("2");
    expect(set.panels).toHaveLength(1);
    expect(set.activePanelId).toBe(set.panels[0]?.panelId);
  });

  it("clones a panel with a new id", () => {
    const panel = defaultStudioDesign();
    const copy = cloneStudioDesign(panel);
    expect(copy.panelId).not.toBe(panel.panelId);
    expect(copy.headline).toBe(panel.headline);
    expect(copy.deviceId).toBe(panel.deviceId);
  });
});
