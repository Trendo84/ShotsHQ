import { describe, expect, it } from "vitest";
import { storeTargetForCatalogId } from "@/lib/devices/store-target";
import { DEVICES } from "@/lib/devices/catalog";

/**
 * Pin the catalog → store-target mapping the overview page (and any
 * other surface that joins `project.storeTargets` to Studio panel
 * device ids) depends on. The mapping is data-driven from the
 * catalog's `required` dim, so this spec is mostly a regression net
 * against catalog drift.
 */

describe("storeTargetForCatalogId()", () => {
  it("maps iPhone 17 Pro Max (required 1320×2868) → iphone_67", () => {
    expect(storeTargetForCatalogId("iphone-17-pro-max")).toBe("iphone_67");
  });

  it("maps iPhone 16 Pro Max (required 1290×2796) → iphone_69", () => {
    expect(storeTargetForCatalogId("iphone-16-pro-max")).toBe("iphone_69");
  });

  it("maps iPhone 16 Plus (required 1290×2796) → iphone_69", () => {
    expect(storeTargetForCatalogId("iphone-16-plus")).toBe("iphone_69");
  });

  it("maps every iPad in the catalog → ipad_13", () => {
    const ipads = DEVICES.filter((d) => d.family === "ipad");
    expect(ipads.length).toBeGreaterThan(0);
    for (const d of ipads) {
      expect(storeTargetForCatalogId(d.id)).toBe("ipad_13");
    }
  });

  it("falls back to iphone_69 for catalog iPhone with no matching locked-class dim (SE 3 at 1242×2208)", () => {
    expect(storeTargetForCatalogId("iphone-se-3")).toBe("iphone_69");
  });

  it("passes through legacy store-target enum values unchanged", () => {
    expect(storeTargetForCatalogId("iphone_69")).toBe("iphone_69");
    expect(storeTargetForCatalogId("iphone_67")).toBe("iphone_67");
    expect(storeTargetForCatalogId("ipad_13")).toBe("ipad_13");
  });

  it("defaults to iphone_69 for an unknown catalog id", () => {
    expect(storeTargetForCatalogId("not-a-device")).toBe("iphone_69");
    expect(storeTargetForCatalogId("")).toBe("iphone_69");
  });

  it("every CURRENT iPhone in the catalog maps to one of the two iPhone store-targets", () => {
    const iphones = DEVICES.filter((d) => d.family === "iphone" && d.current);
    expect(iphones.length).toBeGreaterThan(0);
    for (const d of iphones) {
      const target = storeTargetForCatalogId(d.id);
      expect(["iphone_69", "iphone_67"]).toContain(target);
    }
  });
});
