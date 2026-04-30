import { describe, it, expect } from "vitest";
import { defaultCanvas } from "@/lib/canvas/defaults";

describe("defaultCanvas()", () => {
  it("produces an iPhone 6.9″ canvas with the locked Apple dimensions", () => {
    const c = defaultCanvas("iphone_69");
    expect(c.width).toBe(1290);
    expect(c.height).toBe(2796);
    expect(c.device).toBe("iphone_69");
    expect(c.version).toBe("1");
  });

  it("produces an iPhone 6.7″ canvas at 1320×2868", () => {
    const c = defaultCanvas("iphone_67");
    expect(c.width).toBe(1320);
    expect(c.height).toBe(2868);
  });

  it("produces an iPad 13″ canvas at 2064×2752", () => {
    const c = defaultCanvas("ipad_13");
    expect(c.width).toBe(2064);
    expect(c.height).toBe(2752);
  });

  it("seeds three text layers — eyebrow, headline, subheadline", () => {
    const c = defaultCanvas();
    expect(c.layers).toHaveLength(3);
    const roles = c.layers.map((l) => (l.kind === "text" ? l.role : null));
    expect(roles).toEqual(["eyebrow", "headline", "subheadline"]);
    for (const layer of c.layers) {
      expect(layer.kind).toBe("text");
    }
  });

  it("marks every default layer as system: true (placeholder content)", () => {
    const c = defaultCanvas();
    for (const layer of c.layers) {
      if (layer.kind !== "text") continue;
      expect(layer.system).toBe(true);
    }
  });

  it("places all default text layers in the upper half (y < h/2)", () => {
    const c = defaultCanvas();
    for (const layer of c.layers) {
      if (layer.kind !== "text") continue;
      expect(layer.y).toBeLessThan(c.height / 2);
    }
  });

  it("sets a gradient backdrop with two colors", () => {
    const c = defaultCanvas();
    expect(c.background.type).toBe("gradient");
    if (c.background.type === "gradient") {
      expect(c.background.colors).toHaveLength(2);
      expect(typeof c.background.colors[0]).toBe("string");
      expect(typeof c.background.colors[1]).toBe("string");
    }
  });

  it("rounds layer coordinates to integer pixels", () => {
    const c = defaultCanvas();
    for (const layer of c.layers) {
      if (layer.kind !== "text") continue;
      expect(Number.isInteger(layer.x)).toBe(true);
      expect(Number.isInteger(layer.y)).toBe(true);
      expect(Number.isInteger(layer.width)).toBe(true);
    }
  });
});
