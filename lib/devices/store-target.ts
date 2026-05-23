/**
 * Map a marketing-catalog device id (e.g. "iphone-17-pro-max") to
 * the canonical store-target enum used in the persistence layer
 * (`iphone_69` / `iphone_67` / `ipad_13`).
 *
 * The catalog has many devices; the store-target enum has three. The
 * project's `storeTargets` column persists catalog ids, while the
 * Studio panel state persists store-target enums on each panel's
 * `deviceId`. Joining the two — "how many panels target this device?"
 * — requires this mapping.
 *
 * Data-driven: we look at each catalog device's `required: true`
 * screenshot dim and find which store-target accepts that dim. So
 * iPhone 17 Pro Max (required 1320×2868) → iphone_67; iPhone 16
 * Pro Max (required 1290×2796) → iphone_69; every iPad (required
 * 2064×2752) → ipad_13. Catalog devices with no matching locked-
 * class dim (e.g. legacy SE 3 at 1242×2208) fall back to the
 * family's canonical class.
 *
 * Same rule as `components/editor/EditorPanels.tsx → storeTargetForCatalogId`;
 * extracted here so the project overview page, exports page, and any
 * future surface can share one mapping without duplicating the logic.
 */

import { DEVICES_BY_ID, type Device } from "@/lib/devices/catalog";
import { findStoreTargetByDimensions, type StoreTarget } from "@/lib/utils/store-dimensions";

export function storeTargetForCatalogId(catalogId: string): StoreTarget {
  // Pass-through: if the caller already has a store-target enum value,
  // accept it. Some legacy/loose call sites pass either form.
  if (catalogId === "iphone_69" || catalogId === "iphone_67" || catalogId === "ipad_13") {
    return catalogId;
  }

  const d: Device | undefined = DEVICES_BY_ID[catalogId];
  if (!d) return "iphone_69";

  const required = d.screenshotDims.find((dim) => dim.required) ?? d.screenshotDims[0];
  if (required) {
    const target = findStoreTargetByDimensions({ width: required.w, height: required.h });
    if (target) return target;
  }
  // Catalog device with no matching locked-class dim (e.g. legacy SE) —
  // fall back to the family's canonical class.
  return d.family === "ipad" ? "ipad_13" : "iphone_69";
}
