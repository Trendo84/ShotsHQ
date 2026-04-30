import { describe, it, expect } from "vitest";
import { validateShotsCanvas } from "@/lib/canvas/schema";
import { defaultCanvas } from "@/lib/canvas/defaults";

/**
 * Regression tests for `validateShotsCanvas` — the Zod-backed runtime
 * validator that gates `polotnoJson` JSONB shapes before they reach
 * FabricCanvas's mount loop. Fixes audit finding
 * `docs/audits/2026-04-30-comet-sonnet-editor.md` #2 (malformed canvas
 * data → silent editor route failure with no error boundary).
 */

describe("validateShotsCanvas()", () => {
  it("accepts a freshly-built default canvas", () => {
    const c = defaultCanvas();
    const validated = validateShotsCanvas(c);
    expect(validated).not.toBeNull();
    expect(validated?.width).toBe(c.width);
    expect(validated?.layers.length).toBe(c.layers.length);
  });

  it("accepts all three device dimensions", () => {
    expect(validateShotsCanvas(defaultCanvas("iphone_69"))).not.toBeNull();
    expect(validateShotsCanvas(defaultCanvas("iphone_67"))).not.toBeNull();
    expect(validateShotsCanvas(defaultCanvas("ipad_13"))).not.toBeNull();
  });

  it("REJECTS missing required top-level fields", () => {
    expect(validateShotsCanvas({})).toBeNull();
    expect(validateShotsCanvas({ version: "1" })).toBeNull();
    expect(validateShotsCanvas({ version: "1", device: "iphone_69" })).toBeNull();
  });

  it("REJECTS missing width / height", () => {
    const c = defaultCanvas();
    const noWidth = { ...c, width: undefined };
    const noHeight = { ...c, height: undefined };
    expect(validateShotsCanvas(noWidth)).toBeNull();
    expect(validateShotsCanvas(noHeight)).toBeNull();
  });

  it("REJECTS negative or zero width / height", () => {
    const c = defaultCanvas();
    expect(validateShotsCanvas({ ...c, width: 0 })).toBeNull();
    expect(validateShotsCanvas({ ...c, width: -100 })).toBeNull();
    expect(validateShotsCanvas({ ...c, height: -100 })).toBeNull();
  });

  it("REJECTS unknown device id", () => {
    const c = defaultCanvas();
    expect(validateShotsCanvas({ ...c, device: "iphone_99" })).toBeNull();
    expect(validateShotsCanvas({ ...c, device: "" })).toBeNull();
  });

  it("REJECTS legacy version strings", () => {
    const c = defaultCanvas();
    expect(validateShotsCanvas({ ...c, version: "0" })).toBeNull();
    expect(validateShotsCanvas({ ...c, version: "2" })).toBeNull();
  });

  it("REJECTS layers with missing role", () => {
    const c = defaultCanvas();
    const headlineWithoutRole = { ...c.layers[0]! } as Record<string, unknown>;
    delete headlineWithoutRole.role;
    expect(validateShotsCanvas({ ...c, layers: [headlineWithoutRole] })).toBeNull();
  });

  it("REJECTS layers with unknown role", () => {
    const c = defaultCanvas();
    const layer = { ...c.layers[0], role: "footer" };
    expect(validateShotsCanvas({ ...c, layers: [layer] })).toBeNull();
  });

  it("REJECTS layers with non-numeric coordinates", () => {
    const c = defaultCanvas();
    const layer = { ...c.layers[0], x: "100" };
    expect(validateShotsCanvas({ ...c, layers: [layer] })).toBeNull();
  });

  it("REJECTS background with unknown type", () => {
    const c = defaultCanvas();
    const bg = { type: "rainbow" as unknown as "solid", color: "#fff" };
    expect(validateShotsCanvas({ ...c, background: bg })).toBeNull();
  });

  it("REJECTS gradient with wrong colors arity (single instead of pair)", () => {
    const c = defaultCanvas();
    const bg = { type: "gradient", colors: ["#fff"], angle: 90 };
    expect(validateShotsCanvas({ ...c, background: bg })).toBeNull();
  });

  it("REJECTS completely garbage values", () => {
    expect(validateShotsCanvas(null)).toBeNull();
    expect(validateShotsCanvas(undefined)).toBeNull();
    expect(validateShotsCanvas("string")).toBeNull();
    expect(validateShotsCanvas(42)).toBeNull();
    expect(validateShotsCanvas([])).toBeNull();
    expect(validateShotsCanvas([defaultCanvas()])).toBeNull(); // array of canvases
  });

  it("ACCEPTS a canvas with the optional system flag on text layers", () => {
    const c = defaultCanvas();
    const layer = { ...c.layers[0], system: true };
    expect(validateShotsCanvas({ ...c, layers: [layer] })).not.toBeNull();
  });

  it("ACCEPTS a canvas without the optional system flag (legacy)", () => {
    const c = defaultCanvas();
    const layer = { ...c.layers[0] } as Record<string, unknown>;
    delete layer.system;
    expect(validateShotsCanvas({ ...c, layers: [layer] })).not.toBeNull();
  });

  it("ACCEPTS app-screenshot layers alongside text layers", () => {
    const c = defaultCanvas();
    const screenshotLayer = {
      id: "screenshot-1",
      kind: "app-screenshot" as const,
      url: "https://r2.example.com/foo.png",
      r2Key: "users/1/screens/foo.png",
      x: 0, y: 0, width: 1290, height: 2796,
      visible: true, locked: false,
    };
    expect(validateShotsCanvas({ ...c, layers: [...c.layers, screenshotLayer] })).not.toBeNull();
  });
});
