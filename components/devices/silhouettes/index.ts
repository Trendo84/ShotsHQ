/**
 * Silhouette picker — maps a `Device` to the right SVG component.
 *
 * Decision tree (catalog-derived, deterministic — no schema additions
 * needed because `family` and `topCutout` are already on every device):
 *
 *   family === "iphone"
 *     ├ topCutout === "island" → IphoneDynamicIsland
 *     ├ topCutout === "notch"  → IphoneNotch
 *     └ topCutout === "none"   → IphoneHomeButton
 *   family === "ipad"          → IpadFlat
 *
 * The helper returns a component reference (not an element) so the
 * caller decides when and how to render. DeviceTile uses this to
 * substitute the inner mockup graphic without changing tile
 * dimensions, REQUIRED badge, or selected/unselected behavior.
 *
 * Future-proofing: any new device added to the catalog with one of
 * the existing `(family, topCutout)` combinations works automatically.
 * If we ever add a new combination (e.g. iPad with notch, family
 * "vision"), the unit test in `tests/devices/silhouette-pick.test.ts`
 * will catch the unmapped case.
 */

import type { Device } from "@/lib/devices/catalog";
import type { SilhouetteProps } from "./types";
import { IphoneDynamicIsland } from "./IphoneDynamicIsland";
import { IphoneNotch }         from "./IphoneNotch";
import { IphoneHomeButton }    from "./IphoneHomeButton";
import { IpadFlat }            from "./IpadFlat";

export type SilhouetteComponent = (props: SilhouetteProps) => React.JSX.Element;

export {
  IphoneDynamicIsland,
  IphoneNotch,
  IphoneHomeButton,
  IpadFlat,
};
export type { SilhouetteProps };

export function pickSilhouette(device: Device): SilhouetteComponent {
  if (device.family === "ipad") return IpadFlat;
  // family === "iphone" — disambiguate by topCutout.
  switch (device.topCutout) {
    case "island": return IphoneDynamicIsland;
    case "notch":  return IphoneNotch;
    case "none":   return IphoneHomeButton;
    default: {
      // Exhaustiveness guard. If someone adds a new topCutout value
      // to the catalog without updating this switch, TypeScript
      // catches it here and the silhouette-pick.test.ts decision-
      // tree test fails on the new device.
      const _exhaustive: never = device.topCutout;
      void _exhaustive;
      return IphoneDynamicIsland;
    }
  }
}
