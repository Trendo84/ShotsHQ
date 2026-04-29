import type { ShotsCanvas, DeviceId } from "./schema";

const DEVICE_DIMS: Record<DeviceId, { width: number; height: number }> = {
  iphone_69: { width: 1290, height: 2796 },
  iphone_67: { width: 1320, height: 2868 },
  ipad_13:   { width: 2064, height: 2752 },
};

/** Build a starter canvas for a new project. */
export function defaultCanvas(device: DeviceId = "iphone_69"): ShotsCanvas {
  const { width: w, height: h } = DEVICE_DIMS[device];
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
        x:          Math.round(w * 0.1),
        y:          Math.round(h * 0.07),
        width:      Math.round(w * 0.8),
        visible:    true,
        locked:     false,
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
        x:          Math.round(w * 0.05),
        y:          Math.round(h * 0.12),
        width:      Math.round(w * 0.9),
        visible:    true,
        locked:     false,
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
        x:          Math.round(w * 0.1),
        y:          Math.round(h * 0.30),
        width:      Math.round(w * 0.8),
        visible:    true,
        locked:     false,
      },
    ],
  };
}
