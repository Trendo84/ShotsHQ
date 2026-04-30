import { describe, it, expect } from "vitest";
import { deriveBadgeState, badgeLabel } from "@/lib/exports/badge";

/**
 * Regression tests for the exports-page badge state derivation. Fixes
 * audit finding `docs/audits/2026-04-30-comet-sonnet-editor.md` #4
 * ("NOT TARGETED" reads as a setup failure when it actually means the
 * user has decided not to include those devices).
 */

describe("deriveBadgeState()", () => {
  it("returns NOT INCLUDED for untargeted devices regardless of frame counts", () => {
    expect(deriveBadgeState({ targeted: false })).toEqual({ kind: "not-included" });
    expect(deriveBadgeState({ targeted: false, framesRendered: 5, framesTotal: 10 }))
      .toEqual({ kind: "not-included" });
  });

  it("returns WAITING for targeted devices with 0 total frames", () => {
    expect(deriveBadgeState({ targeted: true })).toEqual({ kind: "waiting" });
    expect(deriveBadgeState({ targeted: true, framesTotal: 0 })).toEqual({ kind: "waiting" });
    expect(deriveBadgeState({ targeted: true, framesRendered: 0, framesTotal: 0 }))
      .toEqual({ kind: "waiting" });
  });

  it("returns IN-PROGRESS when some frames are rendered, more pending", () => {
    expect(deriveBadgeState({ targeted: true, framesRendered: 3, framesTotal: 6 }))
      .toEqual({ kind: "in-progress", rendered: 3, total: 6 });
    expect(deriveBadgeState({ targeted: true, framesRendered: 1, framesTotal: 5 }))
      .toEqual({ kind: "in-progress", rendered: 1, total: 5 });
  });

  it("returns COMPLETE when all frames are rendered", () => {
    expect(deriveBadgeState({ targeted: true, framesRendered: 6, framesTotal: 6 }))
      .toEqual({ kind: "complete", total: 6 });
    expect(deriveBadgeState({ targeted: true, framesRendered: 10, framesTotal: 10 }))
      .toEqual({ kind: "complete", total: 10 });
  });

  it("treats over-rendered as COMPLETE (defensive, shouldn't happen in practice)", () => {
    expect(deriveBadgeState({ targeted: true, framesRendered: 7, framesTotal: 6 }))
      .toEqual({ kind: "complete", total: 6 });
  });

  it("treats undefined frame counts as 0 / 0 (= waiting)", () => {
    expect(deriveBadgeState({ targeted: true })).toEqual({ kind: "waiting" });
  });
});

describe("badgeLabel()", () => {
  it("renders the user-facing string for each state", () => {
    expect(badgeLabel({ kind: "not-included" })).toBe("NOT INCLUDED");
    expect(badgeLabel({ kind: "waiting" })).toBe("READY · WAITING FOR FRAMES");
    expect(badgeLabel({ kind: "in-progress", rendered: 3, total: 6 }))
      .toBe("READY · 3 / 6 FRAMES");
    expect(badgeLabel({ kind: "complete", total: 6 }))
      .toBe("COMPLETE · 6 / 6 FRAMES");
  });

  it("never renders the old NOT TARGETED string (the bug we fixed)", () => {
    const allStates = [
      { targeted: false },
      { targeted: true },
      { targeted: true, framesRendered: 1, framesTotal: 4 },
      { targeted: true, framesRendered: 4, framesTotal: 4 },
    ] as const;
    for (const opts of allStates) {
      const state = deriveBadgeState(opts);
      const label = badgeLabel(state);
      expect(label).not.toContain("TARGETED");
    }
  });
});
