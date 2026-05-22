import { describe, it, expect } from "vitest";
import { migrateCanvasToDevice, dimensionsFor } from "@/lib/canvas/migrate-device";
import { defaultCanvas } from "@/lib/canvas/defaults";

/**
 * Audit P1-6: editor device switch was visually broken — canvas
 * dimensions, status bar, persisted JSON, and layer positions all
 * stayed stuck on the old device when the user picked a new one.
 * `migrateCanvasToDevice` is the pure helper that produces the new
 * canvas JSON; this spec pins the contract.
 */

describe("migrateCanvasToDevice()", () => {
  it("returns the same object reference when device is unchanged", () => {
    const c   = defaultCanvas("iphone_69");
    const out = migrateCanvasToDevice(c, "iphone_69");
    // Same identity → React diff won't trigger remount churn.
    expect(out).toBe(c);
  });

  it("updates device + width + height to the new device's dimensions", () => {
    const c   = defaultCanvas("iphone_69");
    const out = migrateCanvasToDevice(c, "ipad_13");
    expect(out.device).toBe("ipad_13");
    expect(out.width).toBe(2064);
    expect(out.height).toBe(2752);
  });

  it("preserves the layer count and layer ids", () => {
    const c   = defaultCanvas("iphone_69");
    const out = migrateCanvasToDevice(c, "ipad_13");
    expect(out.layers).toHaveLength(c.layers.length);
    expect(out.layers.map((l) => l.id)).toEqual(c.layers.map((l) => l.id));
  });

  it("proportionally rescales text layer x / y / width", () => {
    const c = defaultCanvas("iphone_69");
    // pick the headline (middle layer in defaults)
    const headBefore = c.layers.find((l) => l.kind === "text" && l.role === "headline");
    expect(headBefore?.kind).toBe("text");

    const out = migrateCanvasToDevice(c, "ipad_13");
    const headAfter = out.layers.find((l) => l.kind === "text" && l.role === "headline");
    expect(headAfter?.kind).toBe("text");

    if (headBefore?.kind !== "text" || headAfter?.kind !== "text") return;

    // Relative position preserved — y / height ratio should match.
    const yFractionBefore = headBefore.y / c.height;
    const yFractionAfter  = headAfter.y  / out.height;
    expect(Math.abs(yFractionAfter - yFractionBefore)).toBeLessThan(0.01);
  });

  it("scales fontSize by the smaller axis ratio (avoids disproportionate growth)", () => {
    const c = defaultCanvas("iphone_69");
    // 1290 → 2064 = ~1.6x on x; 2796 → 2752 = ~0.98x on y.
    // min ratio is ~0.98 — fonts should NOT grow when going to iPad.
    const out = migrateCanvasToDevice(c, "ipad_13");

    const headBefore = c.layers.find((l) => l.kind === "text" && l.role === "headline");
    const headAfter  = out.layers.find((l) => l.kind === "text" && l.role === "headline");
    if (headBefore?.kind !== "text" || headAfter?.kind !== "text") return;

    // fontSize must not exceed before * max(sx, sy) — sanity guard.
    expect(headAfter.fontSize).toBeLessThanOrEqual(headBefore.fontSize * 1.6);
    // And should be within ~5% of (before * minRatio).
    const minRatio  = Math.min(2064 / 1290, 2752 / 2796);
    const expected  = Math.round(headBefore.fontSize * minRatio);
    expect(Math.abs(headAfter.fontSize - expected)).toBeLessThanOrEqual(2);
  });

  it("enforces a minimum fontSize of 8 (no zero-or-negative fonts on extreme scales)", () => {
    // Synthetic input with a tiny font to exercise the floor.
    const c = defaultCanvas("ipad_13");
    const tinyLayer = c.layers.find((l) => l.kind === "text");
    if (!tinyLayer || tinyLayer.kind !== "text") throw new Error("missing text layer");
    const shrunken = {
      ...c,
      layers: c.layers.map((l) => l.kind === "text" ? { ...l, fontSize: 4 } : l),
    };
    const out = migrateCanvasToDevice(shrunken, "iphone_69");
    for (const l of out.layers) {
      if (l.kind === "text") expect(l.fontSize).toBeGreaterThanOrEqual(8);
    }
  });

  it("rescales x / y / width / height on app-screenshot layers (both axes)", () => {
    const base = defaultCanvas("iphone_69");
    const withImage: typeof base = {
      ...base,
      layers: [
        ...base.layers,
        {
          id:      "screen-1",
          kind:    "app-screenshot",
          url:     "https://example.test/x.png",
          x:       100,
          y:       200,
          width:   500,
          height:  1000,
          visible: true,
          locked:  false,
        },
      ],
    };

    const out = migrateCanvasToDevice(withImage, "ipad_13");
    const img = out.layers.find((l) => l.id === "screen-1");
    expect(img?.kind).toBe("app-screenshot");
    if (img?.kind !== "app-screenshot") return;

    const sx = 2064 / 1290;
    const sy = 2752 / 2796;
    expect(img.x).toBe(Math.round(100 * sx));
    expect(img.y).toBe(Math.round(200 * sy));
    expect(img.width).toBe(Math.round(500 * sx));
    expect(img.height).toBe(Math.round(1000 * sy));
  });

  it("round-trips across all three device pairs without losing layer count", () => {
    const start = defaultCanvas("iphone_69");
    const a = migrateCanvasToDevice(start, "iphone_67");
    const b = migrateCanvasToDevice(a,     "ipad_13");
    const c = migrateCanvasToDevice(b,     "iphone_69");
    expect(c.layers).toHaveLength(start.layers.length);
    expect(c.device).toBe("iphone_69");
    expect(c.width).toBe(1290);
    expect(c.height).toBe(2796);
  });

  it("dimensionsFor() returns the exact App Store dim per device", () => {
    expect(dimensionsFor("iphone_69")).toEqual({ width: 1290, height: 2796 });
    expect(dimensionsFor("iphone_67")).toEqual({ width: 1320, height: 2868 });
    expect(dimensionsFor("ipad_13")).toEqual({ width: 2064, height: 2752 });
  });
});
