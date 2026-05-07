import { describe, it, expect } from "vitest";
import {
  pickDeviceByDimensions,
  pickAllMatches,
  summarizeBucketing,
} from "@/lib/devices/match";
import { DEVICES, DEVICES_BY_ID } from "@/lib/devices/catalog";

/**
 * Contract test for the dimension matcher.
 *
 * Assertions emphasise OBSERVABLE outcomes (family, presence of an
 * iphone match, count of expected unmatches) rather than exact device
 * IDs — so the tests don't have to be rewritten every time the
 * catalog adds a new device. The catalog round-trip test at the end
 * is the strict guarantor: every device's required dim must round-
 * trip back to a matching device.
 */

describe("pickDeviceByDimensions()", () => {
  // ── 1. 1290×2796 — required for 6.7" Plus + 15/16 Pro Max ─────────────
  it("matches an iPhone for 1290×2796 (multi-device required dim)", () => {
    const match = pickDeviceByDimensions({ width: 1290, height: 2796 });
    expect(match).not.toBeNull();
    expect(match!.device.family).toBe("iphone");
    expect(match!.dim).toEqual(expect.objectContaining({ w: 1290, h: 2796 }));
  });

  // ── 2. 1320×2868 — required for 16 Pro Max + 17 family ────────────────
  it("matches an iPhone for 1320×2868", () => {
    const match = pickDeviceByDimensions({ width: 1320, height: 2868 });
    expect(match).not.toBeNull();
    expect(match!.device.family).toBe("iphone");
    expect(match!.dim).toEqual(expect.objectContaining({ w: 1320, h: 2868 }));
  });

  // ── 3. 2064×2752 — required iPad 13" ──────────────────────────────────
  it("matches an iPad for 2064×2752", () => {
    const match = pickDeviceByDimensions({ width: 2064, height: 2752 });
    expect(match).not.toBeNull();
    expect(match!.device.family).toBe("ipad");
    expect(match!.dim).toEqual(expect.objectContaining({ w: 2064, h: 2752 }));
  });

  // ── 4. 1170×2532 — iPhone 16e (the lone notch device) ─────────────────
  // 16e is currently the only device with topCutout: "notch", but its
  // pixelSize {1170, 2532} is NOT in its screenshotDims (it accepts
  // 1290×2796 to render at App Store dim). So this pixel-native dim
  // intentionally does NOT match — confirms matcher is tied to App
  // Store accepted dims, not device pixel sizes. The matcher is
  // working as designed: only Apple-validated submission dims match.
  it("returns null for 1170×2532 (a pixelSize, not an accepted dim)", () => {
    const match = pickDeviceByDimensions({ width: 1170, height: 2532 });
    expect(match).toBeNull();
  });

  // ── 5. 1242×2208 — iPhone SE (3rd gen) ────────────────────────────────
  it("matches iPhone SE 3 family for 1242×2208 (the home-button device)", () => {
    const match = pickDeviceByDimensions({ width: 1242, height: 2208 });
    expect(match).not.toBeNull();
    expect(match!.device.family).toBe("iphone");
    // SE 3 has topCutout: "none" — confirms we hit the home-button
    // silhouette family on the way back.
    expect(match!.device.topCutout).toBe("none");
  });

  // ── 6. Unrecognised garbage dim ───────────────────────────────────────
  it("returns null for unrecognised dimensions (100×100 garbage)", () => {
    expect(pickDeviceByDimensions({ width: 100, height: 100 })).toBeNull();
  });

  // ── 7. Defensive: invalid inputs ──────────────────────────────────────
  it("returns null for non-finite or non-positive dimensions", () => {
    expect(pickDeviceByDimensions({ width: 0,    height: 100 })).toBeNull();
    expect(pickDeviceByDimensions({ width: -10,  height: 100 })).toBeNull();
    expect(pickDeviceByDimensions({ width: NaN,  height: 100 })).toBeNull();
    expect(pickDeviceByDimensions({ width: 100,  height: 0   })).toBeNull();
    expect(pickDeviceByDimensions({ width: Infinity, height: 100 })).toBeNull();
  });
});

describe("pickAllMatches()", () => {
  // ── 8. Multi-device dim returns ≥2 candidates ─────────────────────────
  it("returns multiple devices for 1290×2796 (shared accepted dim)", () => {
    const matches = pickAllMatches({ width: 1290, height: 2796 });
    expect(matches.length).toBeGreaterThanOrEqual(2);
    // Every match must be in the iPhone family for this dim.
    for (const m of matches) {
      expect(m.device.family).toBe("iphone");
    }
  });

  it("returns empty array for unrecognised dimensions", () => {
    expect(pickAllMatches({ width: 100, height: 100 })).toEqual([]);
  });

  it("returns empty array for invalid dimensions", () => {
    expect(pickAllMatches({ width: 0, height: 0 })).toEqual([]);
  });
});

describe("summarizeBucketing()", () => {
  // ── 9. Mixed input bucketing ──────────────────────────────────────────
  it("counts a mixed input correctly with unmatched", () => {
    const summary = summarizeBucketing([
      { width: 1290, height: 2796 }, // iPhone (whichever wins first)
      { width: 1290, height: 2796 }, // same
      { width: 2064, height: 2752 }, // iPad
      { width: 100,  height: 100  }, // unmatched
    ]);

    expect(summary.unmatched).toBe(1);
    // Total matched should be 3 across all device buckets.
    let totalMatched = 0;
    for (const count of summary.byDevice.values()) totalMatched += count;
    expect(totalMatched).toBe(3);
  });

  it("returns zero-counts for an empty input", () => {
    const summary = summarizeBucketing([]);
    expect(summary.unmatched).toBe(0);
    expect(summary.byDevice.size).toBe(0);
  });
});

// ── 10. Catalog round-trip — every device's required dim resolves ─────
//
// This is the strict guarantor: if a device declares a required
// screenshotDim, the matcher MUST find some device for that dim. The
// matched device may not be the same one (multi-device shared dims
// are real) but it must be SOME catalog device. Catches regressions
// where a new device's dim accidentally fails to round-trip.

describe("catalog round-trip", () => {
  it("every device's required dim resolves to some catalog device", () => {
    for (const device of DEVICES) {
      for (const dim of device.screenshotDims) {
        if (!dim.required) continue;
        const match = pickDeviceByDimensions({ width: dim.w, height: dim.h });
        expect(
          match,
          `Required dim ${dim.w}×${dim.h} on ${device.id} did not round-trip`,
        ).not.toBeNull();
        // The matched device must exist in DEVICES_BY_ID — sanity check.
        expect(DEVICES_BY_ID[match!.device.id]).toBeDefined();
      }
    }
  });
});
