/**
 * Pure device-switch reducer for the Studio engine.
 *
 * Extracted so the device-switch logic can be unit-tested without booting
 * React, jsdom, or a headless browser. The UI in `StudioClient.tsx` is
 * just a thin shell over this reducer; if the reducer's invariants hold,
 * the UI lie ("clicked iPad, iPhone 6.9 stays selected") is exactly the
 * kind of regression the test surface catches.
 *
 * Browser audit (2026-05-23) flagged the Studio device-class buttons as a
 * UI lie:
 *   - clicking iPhone 6.7" or iPad 13" leaves iPhone 6.9" visually selected
 *   - preview header keeps showing iPhone 6.9" · 1290×2796
 *   - filmstrip card label stays on iPhone 6.9"
 * Frame compatibility must also be enforced — when switching to iPad,
 * an iPhone-only frame (pro-device, flat-device) is incompatible and
 * must be replaced with the iPad default (tablet-device).
 */

import type { DeviceId } from "@/lib/canvas/schema";
import {
  defaultFrameForDevice,
  frameById,
  type StudioDesign,
  type StudioDesignSet,
} from "@/components/studio/types";

/**
 * Apply a device change to a single panel. Pure: returns a new panel
 * object (or the input if no change). Touches `deviceId` + `frameId`
 * only — preserves the headline, subhead, theme, layout, screenshot.
 *
 * Frame compatibility is enforced via `frameById`, which falls back
 * to `defaultFrameForDevice(nextDevice)` when the panel's current
 * frame doesn't belong to the new device's family.
 */
export function applyDeviceToPanel(panel: StudioDesign, nextDevice: DeviceId): StudioDesign {
  if (panel.deviceId === nextDevice) return panel;
  const nextFrame = frameById(panel.frameId, nextDevice);
  return {
    ...panel,
    deviceId: nextDevice,
    frameId:  nextFrame.id,
  };
}

/**
 * Apply a device change to the active panel within a design set.
 * Pure. Returns a new set (or input on no-op) with the matching panel
 * replaced. Other panels untouched. `activePanelId` preserved.
 */
export function applyDeviceToActivePanel(set: StudioDesignSet, nextDevice: DeviceId): StudioDesignSet {
  const activeIndex = set.panels.findIndex((p) => p.panelId === set.activePanelId);
  if (activeIndex < 0) return set;
  const active = set.panels[activeIndex];
  if (!active) return set;
  const updated = applyDeviceToPanel(active, nextDevice);
  if (updated === active) return set;
  const panels = set.panels.slice();
  panels[activeIndex] = updated;
  return { ...set, panels };
}

/**
 * Convenience: return the frame that would be used after a device
 * switch for a panel. Lets the UI preview frame swaps before committing
 * (not used in the current Studio shell but useful for tests + future
 * "confirm before swap" affordances).
 */
export function frameAfterDeviceSwitch(panel: StudioDesign, nextDevice: DeviceId) {
  if (panel.deviceId === nextDevice) return frameById(panel.frameId, panel.deviceId);
  return frameById(panel.frameId, nextDevice) ?? defaultFrameForDevice(nextDevice);
}
