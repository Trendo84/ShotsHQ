import { describe, expect, it } from "vitest";
import {
  applyDeviceToActivePanel,
  applyDeviceToPanel,
} from "@/lib/studio/device-switch";
import {
  cloneStudioDesign,
  defaultStudioDesign,
  defaultStudioDesignSet,
  type StudioDesign,
  type StudioDesignSet,
} from "@/components/studio/types";

/**
 * Audit (2026-05-23, browser-verified): clicking iPhone 6.7" or iPad 13"
 * in Studio's Device class panel leaves iPhone 6.9" visually selected.
 * Preview header and filmstrip metadata don't update either. This test
 * surface pins the device-switch contract end-to-end at the reducer
 * level so any regression is loud.
 */

describe("applyDeviceToPanel()", () => {
  it("updates the panel's deviceId when switching iPhone 6.9 → iPad 13", () => {
    const panel = defaultStudioDesign("iphone_69");
    const next = applyDeviceToPanel(panel, "ipad_13");
    expect(next.deviceId).toBe("ipad_13");
  });

  it("returns the same object reference on a no-op switch (same device)", () => {
    const panel = defaultStudioDesign("iphone_69");
    const next = applyDeviceToPanel(panel, "iphone_69");
    expect(next).toBe(panel);
  });

  it("preserves headline, subhead, sizes, theme, layout on device switch", () => {
    const panel: StudioDesign = {
      ...defaultStudioDesign("iphone_69"),
      headline:     "Custom headline",
      subhead:      "Custom subhead",
      headlineSize: 42,
      subheadSize:  20,
      align:        "right",
      fontFamily:   "mono",
      layout:       "device-angled",
      themeId:      "swiss-industrial",
      bg:           "#F4F4F0",
      bg2:          "#E7E0D1",
      bgKind:       "linear",
      text:         "#111111",
      accent:       "#E61919",
    };
    const next = applyDeviceToPanel(panel, "iphone_67");
    expect(next.headline).toBe("Custom headline");
    expect(next.subhead).toBe("Custom subhead");
    expect(next.headlineSize).toBe(42);
    expect(next.subheadSize).toBe(20);
    expect(next.align).toBe("right");
    expect(next.fontFamily).toBe("mono");
    expect(next.layout).toBe("device-angled");
    expect(next.themeId).toBe("swiss-industrial");
    expect(next.text).toBe("#111111");
    expect(next.bg).toBe("#F4F4F0");
    expect(next.bg2).toBe("#E7E0D1");
    expect(next.bgKind).toBe("linear");
  });

  it("preserves an uploaded screenshot URL on device switch", () => {
    const panel = {
      ...defaultStudioDesign("iphone_69"),
      screenshotUrl: "blob:http://localhost/abc-123",
      screenshotRemote: false,
    };
    const next = applyDeviceToPanel(panel, "iphone_67");
    expect(next.screenshotUrl).toBe("blob:http://localhost/abc-123");
    expect(next.screenshotRemote).toBe(false);
  });

  // Frame compatibility — the core invariant the device-switch must enforce.

  it("swaps an iPhone-only frame for the iPad default when going iPhone → iPad", () => {
    const panel = defaultStudioDesign("iphone_69");
    // Sanity: default iPhone frame is iPhone-family-only.
    expect(panel.frameId).toBe("pro-device");
    const next = applyDeviceToPanel(panel, "ipad_13");
    expect(next.deviceId).toBe("ipad_13");
    expect(next.frameId).toBe("tablet-device");
  });

  it("swaps an iPad-only frame for the iPhone default when going iPad → iPhone", () => {
    const panel = defaultStudioDesign("ipad_13");
    expect(panel.frameId).toBe("tablet-device");
    const next = applyDeviceToPanel(panel, "iphone_69");
    expect(next.deviceId).toBe("iphone_69");
    expect(next.frameId).toBe("pro-device");
  });

  it("keeps a cross-family frame (frameless) when switching devices", () => {
    const panel = { ...defaultStudioDesign("iphone_69"), frameId: "frameless" };
    const next = applyDeviceToPanel(panel, "ipad_13");
    expect(next.frameId).toBe("frameless");
  });

  it("keeps the iPhone-family frame when switching between iPhone sub-classes", () => {
    const panel = { ...defaultStudioDesign("iphone_69"), frameId: "flat-device" };
    const next = applyDeviceToPanel(panel, "iphone_67");
    expect(next.deviceId).toBe("iphone_67");
    expect(next.frameId).toBe("flat-device");
  });
});

describe("applyDeviceToActivePanel()", () => {
  it("only modifies the active panel, leaves others untouched", () => {
    const a = defaultStudioDesign("iphone_69");
    const b = cloneStudioDesign(defaultStudioDesign("iphone_69"));
    const c = cloneStudioDesign(defaultStudioDesign("iphone_69"));
    const set: StudioDesignSet = {
      version: "2",
      activePanelId: b.panelId,
      panels: [a, b, c],
    };
    const next = applyDeviceToActivePanel(set, "ipad_13");
    expect(next.panels[0]?.deviceId).toBe("iphone_69");
    expect(next.panels[1]?.deviceId).toBe("ipad_13");
    expect(next.panels[2]?.deviceId).toBe("iphone_69");
    expect(next.activePanelId).toBe(b.panelId);
  });

  it("returns the same set on a no-op switch", () => {
    const set = defaultStudioDesignSet("iphone_69");
    const next = applyDeviceToActivePanel(set, "iphone_69");
    expect(next).toBe(set);
  });

  it("returns the same set when activePanelId points at no real panel", () => {
    const set: StudioDesignSet = {
      ...defaultStudioDesignSet("iphone_69"),
      activePanelId: "missing-panel-id",
    };
    const next = applyDeviceToActivePanel(set, "ipad_13");
    expect(next).toBe(set);
  });

  it("creates a new panels array on a real switch (reference change for React)", () => {
    const set = defaultStudioDesignSet("iphone_69");
    const next = applyDeviceToActivePanel(set, "ipad_13");
    expect(next.panels).not.toBe(set.panels);
    expect(next).not.toBe(set);
  });
});
