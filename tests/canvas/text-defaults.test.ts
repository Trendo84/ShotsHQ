import { describe, it, expect } from "vitest";
import { textDefaultsFor, TEXT_LAYOUT } from "@/lib/canvas/dispatch";
import { defaultCanvas } from "@/lib/canvas/defaults";

/**
 * Regression test for the coordinate-mismatch bug: previously
 * `defaultCanvas()` placed text in the upper region (h*0.07–0.30) while
 * `textDefaults()` in FabricCanvas put NEW text in the middle region
 * (h*0.42–0.46). Adding any text via the panel created a duplicate
 * stack in a different zone — the visible "duplicate template content"
 * symptom in the bug report.
 *
 * After the fix, both code paths read `TEXT_LAYOUT` from
 * `lib/canvas/dispatch.ts`. This test asserts they stay aligned within
 * ±1px (rounding noise).
 */
describe("textDefaultsFor() / defaultCanvas() coordinate alignment", () => {
  const W = 1290;
  const H = 2796;

  it("eyebrow position matches defaultCanvas eyebrow within ±1px", () => {
    const td      = textDefaultsFor("eyebrow", W, H);
    const seeded  = defaultCanvas("iphone_69").layers.find((l) => l.kind === "text" && l.role === "eyebrow");
    expect(seeded).toBeDefined();
    if (!seeded || seeded.kind !== "text") throw new Error("seeded eyebrow missing");
    expect(Math.abs(td.x      - seeded.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(td.y      - seeded.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(td.width  - seeded.width)).toBeLessThanOrEqual(1);
  });

  it("headline position matches defaultCanvas headline within ±1px", () => {
    const td     = textDefaultsFor("headline", W, H);
    const seeded = defaultCanvas("iphone_69").layers.find((l) => l.kind === "text" && l.role === "headline");
    if (!seeded || seeded.kind !== "text") throw new Error("seeded headline missing");
    expect(Math.abs(td.x     - seeded.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(td.y     - seeded.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(td.width - seeded.width)).toBeLessThanOrEqual(1);
  });

  it("subheadline position matches defaultCanvas subheadline within ±1px", () => {
    const td     = textDefaultsFor("subheadline", W, H);
    const seeded = defaultCanvas("iphone_69").layers.find((l) => l.kind === "text" && l.role === "subheadline");
    if (!seeded || seeded.kind !== "text") throw new Error("seeded subheadline missing");
    expect(Math.abs(td.x     - seeded.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(td.y     - seeded.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(td.width - seeded.width)).toBeLessThanOrEqual(1);
  });

  it("cta exists in TEXT_LAYOUT even though defaultCanvas does not seed it", () => {
    expect(TEXT_LAYOUT.cta).toBeDefined();
    const td = textDefaultsFor("cta", W, H);
    // CTA anchors the bottom of the screen content area.
    expect(td.y).toBeGreaterThan(H * 0.4);
    expect(td.y).toBeLessThan(H * 0.55);
  });

  it("layer Y positions read top-to-bottom in expected role order", () => {
    const eyebrow  = textDefaultsFor("eyebrow",     W, H);
    const headline = textDefaultsFor("headline",    W, H);
    const subhead  = textDefaultsFor("subheadline", W, H);
    const cta      = textDefaultsFor("cta",         W, H);
    expect(eyebrow.y).toBeLessThan(headline.y);
    expect(headline.y).toBeLessThan(subhead.y);
    expect(subhead.y).toBeLessThan(cta.y);
  });

  it("scales proportionally for iPad (2064×2752)", () => {
    const td = textDefaultsFor("headline", 2064, 2752);
    // headline lives at roughly h*0.12 = ~330. Allow rounding noise.
    expect(td.y).toBeGreaterThan(2752 * 0.10);
    expect(td.y).toBeLessThan(2752 * 0.15);
    expect(td.x).toBeGreaterThan(2064 * 0.04);
    expect(td.x).toBeLessThan(2064 * 0.07);
  });
});
