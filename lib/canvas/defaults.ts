import type { ShotsCanvas, DeviceId } from "./schema";
import { TEXT_LAYOUT } from "./dispatch";

const DEVICE_DIMS: Record<DeviceId, { width: number; height: number }> = {
  iphone_69: { width: 1290, height: 2796 },
  iphone_67: { width: 1320, height: 2868 },
  ipad_13:   { width: 2064, height: 2752 },
};

/**
 * Build a starter canvas for a new project. Layer positions come from
 * `TEXT_LAYOUT` in `dispatch.ts` — the same source the editor's
 * `addTextLayer` flow reads, so the two paths can never drift apart.
 */
export function defaultCanvas(device: DeviceId = "iphone_69"): ShotsCanvas {
  const { width: w, height: h } = DEVICE_DIMS[device];
  const eyeb  = TEXT_LAYOUT.eyebrow;
  const head  = TEXT_LAYOUT.headline;
  const sub   = TEXT_LAYOUT.subheadline;
  return {
    version:    "1",
    device,
    width:      w,
    height:     h,
    background: { type: "gradient", colors: ["#0F1117", "#1A1A2E"], angle: 145 },
    layers: [
      {
        id:         "eyebrow",
        kind:       "text",
        role:       "eyebrow",
        content:    "APP NAME",
        fontFamily: "JetBrains Mono, monospace",
        fontSize:   52,
        fontWeight: "400",
        color:      "#FF2A2A",
        align:      "center",
        x:          Math.round(w * eyeb.x),
        y:          Math.round(h * eyeb.y),
        width:      Math.round(w * eyeb.width),
        visible:    true,
        locked:     false,
        system:     true,
      },
      {
        id:         "headline",
        kind:       "text",
        role:       "headline",
        content:    "Your headline\ngoes here",
        fontFamily: "Archivo Black, sans-serif",
        fontSize:   130,
        fontWeight: "900",
        color:      "#FFFFFF",
        align:      "center",
        x:          Math.round(w * head.x),
        y:          Math.round(h * head.y),
        width:      Math.round(w * head.width),
        visible:    true,
        locked:     false,
        system:     true,
      },
      {
        id:         "subheadline",
        kind:       "text",
        role:       "subheadline",
        content:    "One clear line of supporting copy",
        fontFamily: "Inter, sans-serif",
        fontSize:   58,
        fontWeight: "400",
        color:      "#B5B5B5",
        align:      "center",
        x:          Math.round(w * sub.x),
        y:          Math.round(h * sub.y),
        width:      Math.round(w * sub.width),
        visible:    true,
        locked:     false,
        system:     true,
      },
    ],
  };
}
