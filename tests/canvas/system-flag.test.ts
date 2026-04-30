import { describe, it, expect } from "vitest";
import { resolveTextDispatch } from "@/lib/canvas/dispatch";
import type { TextLayer } from "@/lib/canvas/schema";

/**
 * Regression tests for the role-collision policy in
 * `lib/canvas/dispatch.ts`. This is the function that prevents the
 * "click headline preset → duplicate headline below the existing one"
 * bug observed on the live build.
 */

function mkText(partial: Partial<TextLayer> & Pick<TextLayer, "id" | "role">): TextLayer {
  return {
    kind:       "text",
    content:    "x",
    fontFamily: "Inter",
    fontSize:   72,
    fontWeight: "400",
    color:      "#FFFFFF",
    align:      "center",
    x:          0,
    y:          0,
    width:      600,
    visible:    true,
    locked:     false,
    ...partial,
  };
}

describe("resolveTextDispatch()", () => {
  it("returns 'add' on an empty canvas", () => {
    expect(resolveTextDispatch([], "headline")).toBe("add");
    expect(resolveTextDispatch([], "cta")).toBe("add");
  });

  it("REPLACES a system placeholder of the same role", () => {
    const layers: TextLayer[] = [
      mkText({ id: "headline", role: "headline", system: true }),
    ];
    const action = resolveTextDispatch(layers, "headline");
    expect(action).toEqual({ kind: "replace", targetId: "headline" });
  });

  it("FOCUSES an existing user-authored singleton (system flipped to false)", () => {
    const layers: TextLayer[] = [
      mkText({ id: "headline", role: "headline", system: false }),
    ];
    const action = resolveTextDispatch(layers, "headline");
    expect(action).toEqual({ kind: "focus", targetId: "headline" });
  });

  it("FOCUSES when system flag is undefined (legacy persisted layer)", () => {
    const layers: TextLayer[] = [
      mkText({ id: "headline", role: "headline" }), // no system field
    ];
    const action = resolveTextDispatch(layers, "headline");
    expect(action).toEqual({ kind: "focus", targetId: "headline" });
  });

  it("STACKS new CTA below the existing CTA (multi-instance role)", () => {
    const layers: TextLayer[] = [
      mkText({ id: "cta-1", role: "cta", system: false }),
    ];
    const action = resolveTextDispatch(layers, "cta");
    expect(action).toEqual({ kind: "stack", afterId: "cta-1" });
  });

  it("STACKS below the MOST RECENT CTA when multiple exist", () => {
    const layers: TextLayer[] = [
      mkText({ id: "cta-1", role: "cta", system: false }),
      mkText({ id: "cta-2", role: "cta", system: false }),
      mkText({ id: "cta-3", role: "cta", system: false }),
    ];
    const action = resolveTextDispatch(layers, "cta");
    expect(action).toEqual({ kind: "stack", afterId: "cta-3" });
  });

  it("REPLACE wins over FOCUS when a system placeholder coexists with a user layer", () => {
    // Edge case: shouldn't happen in practice (we replace before adding) but
    // if it ever does, replacing the placeholder is the safer move.
    const layers: TextLayer[] = [
      mkText({ id: "headline-sys",  role: "headline", system: true  }),
      mkText({ id: "headline-user", role: "headline", system: false }),
    ];
    const action = resolveTextDispatch(layers, "headline");
    expect(action).toEqual({ kind: "replace", targetId: "headline-sys" });
  });

  it("ignores layers of OTHER roles", () => {
    const layers: TextLayer[] = [
      mkText({ id: "eyebrow", role: "eyebrow", system: true }),
      mkText({ id: "subhead", role: "subheadline", system: true }),
    ];
    const action = resolveTextDispatch(layers, "headline");
    expect(action).toBe("add");
  });

  it("treats eyebrow and subheadline as singleton roles (FOCUS, not STACK)", () => {
    const layers: TextLayer[] = [
      mkText({ id: "e", role: "eyebrow",     system: false }),
      mkText({ id: "s", role: "subheadline", system: false }),
    ];
    expect(resolveTextDispatch(layers, "eyebrow")).toEqual({ kind: "focus", targetId: "e" });
    expect(resolveTextDispatch(layers, "subheadline")).toEqual({ kind: "focus", targetId: "s" });
  });
});
