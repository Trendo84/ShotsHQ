import { describe, expect, it } from "vitest";
import { DEVICES, type Device } from "@/lib/devices/catalog";
import {
  pickSilhouette,
  IphoneDynamicIsland,
  IphoneNotch,
  IphoneHomeButton,
  IpadFlat,
} from "@/components/devices/silhouettes";

/**
 * Decision-tree test for `pickSilhouette()`.
 *
 * The test is data-driven against the live catalog so it catches
 * future drift: if someone adds a new device with an unmapped
 * `topCutout` value, the exhaustiveness guard inside `pickSilhouette`
 * lights up at type-check time, and the family-routing assertion
 * here fails at test time as a second line of defense.
 *
 * Per audit triage 2026-05-01 finding #2 — the silhouette family is
 * derived deterministically from `(family, topCutout)`; no runtime
 * logic depends on device id, year, or generation.
 */

function expectedComponentFor(d: Device) {
  if (d.family === "ipad") return IpadFlat;
  switch (d.topCutout) {
    case "island": return IphoneDynamicIsland;
    case "notch":  return IphoneNotch;
    case "none":   return IphoneHomeButton;
  }
}

describe("pickSilhouette()", () => {
  it("routes every device in the catalog to a known silhouette family", () => {
    expect(DEVICES.length).toBeGreaterThan(0); // sanity — catalog is non-empty

    for (const device of DEVICES) {
      const picked   = pickSilhouette(device);
      const expected = expectedComponentFor(device);
      expect(picked, `device ${device.id} (${device.family}/${device.topCutout})`)
        .toBe(expected);
    }
  });

  it("routes iPhone Dynamic Island devices to IphoneDynamicIsland", () => {
    const islanders = DEVICES.filter(
      (d) => d.family === "iphone" && d.topCutout === "island",
    );
    expect(islanders.length).toBeGreaterThan(0); // catalog should have at least one
    for (const device of islanders) {
      expect(pickSilhouette(device)).toBe(IphoneDynamicIsland);
    }
  });

  it("routes iPhone notch devices to IphoneNotch", () => {
    const notched = DEVICES.filter(
      (d) => d.family === "iphone" && d.topCutout === "notch",
    );
    // 16e is the only one in the current catalog — but assert by
    // count > 0 so the test stays valid if Apple ships more notch
    // devices later.
    expect(notched.length).toBeGreaterThan(0);
    for (const device of notched) {
      expect(pickSilhouette(device)).toBe(IphoneNotch);
    }
  });

  it("routes iPhone home-button devices to IphoneHomeButton", () => {
    const home = DEVICES.filter(
      (d) => d.family === "iphone" && d.topCutout === "none",
    );
    expect(home.length).toBeGreaterThan(0);
    for (const device of home) {
      expect(pickSilhouette(device)).toBe(IphoneHomeButton);
    }
  });

  it("routes every iPad family device to IpadFlat regardless of topCutout", () => {
    const ipads = DEVICES.filter((d) => d.family === "ipad");
    expect(ipads.length).toBeGreaterThan(0);
    for (const device of ipads) {
      expect(pickSilhouette(device)).toBe(IpadFlat);
    }
  });

  it("returns the same component reference on repeat calls (stable identity)", () => {
    // DeviceTile renders this component as a JSX element. If the
    // helper returned a new wrapper component on every call, React
    // would unmount + remount per render. Stable identity is part
    // of the contract.
    const target = DEVICES[0]!;
    const a = pickSilhouette(target);
    const b = pickSilhouette(target);
    expect(a).toBe(b);
  });
});
