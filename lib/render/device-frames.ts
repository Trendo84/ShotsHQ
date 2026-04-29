/** Registry for device frame asset paths and required dimensions. */

export const DEVICE_FRAMES = {
  iphone_69: {
    label:   "iPhone 6.9″ (16 Pro Max)",
    width:   1290,
    height:  2796,
    asset:   "/device-frames/iphone-16-pro-max.png",
  },
  iphone_67: {
    label:   "iPhone 6.7″ (15 Pro Max)",
    width:   1320,
    height:  2868,
    asset:   "/device-frames/iphone-15-pro-max.png",
  },
  ipad_13: {
    label:   "iPad 13″ (M4)",
    width:   2064,
    height:  2752,
    asset:   "/device-frames/ipad-13-m4.png",
  },
} as const;

export type DeviceId = keyof typeof DEVICE_FRAMES;
