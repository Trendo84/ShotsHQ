"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { FabricCanvas, type FabricCanvasHandle, type LayerSummary } from "./FabricCanvas";
import { LeftPanel } from "./EditorPanels";
import { RightPanel } from "./RightPanel";
import { saveCanvas } from "@/app/actions/canvas";
import { defaultCanvas } from "@/lib/canvas/defaults";
import { migrateCanvasToDevice } from "@/lib/canvas/migrate-device";
import type { DeviceId, ShotsBackground, ShotsCanvas, TextRole } from "@/lib/canvas/schema";

type Props = {
  projectId:     string;
  projectName:   string;
  initialCanvas: ShotsCanvas | null;
};

/**
 * Editor shell. Lifts layer state from FabricCanvas via `onLayersChange`
 * so the LayersPanel on the left can render real ordered layer summaries
 * and dispatch real mutations back through the imperative handle.
 *
 * The CANVAS JSON itself is now also held in shell state (audit P1-6).
 * Device-frame switching used to be local state inside FramePanel and
 * never reached the Fabric instance — the status bar showed the new
 * device label but the canvas stayed sized for the old one. Lifting
 * the canvas up here lets the device switcher actually take effect:
 *
 *   tile click → migrateCanvasToDevice() → setShots() → FabricCanvas
 *   re-keys on shots.device (mount-effect dep) → fresh Fabric instance
 *   at the new dims, layers proportionally rescaled.
 *
 * Single source of truth: the shell holds the canvas; Fabric is the
 * rendering surface that mirrors it. Every mutation either flows
 * through `canvasRef.current.<method>()` (which fires canvas events
 * that update `layers` state) or through `setShots` (for shell-level
 * changes like device switching).
 */
export function EditorClient({ projectId, projectName: _projectName, initialCanvas }: Props) {
  const canvasRef = useRef<FabricCanvasHandle>(null);
  const [, startTransition] = useTransition();
  const [layers, setLayers] = useState<LayerSummary[]>([]);

  // Canvas JSON held in shell state. Initial value falls back to a
  // freshly-defaulted iPhone 6.9" canvas if the project has no saved
  // polotnoJson yet — matches the prior FabricCanvas-internal fallback.
  const [shots, setShots] = useState<ShotsCanvas>(
    () => initialCanvas ?? defaultCanvas("iphone_69"),
  );

  const handleSave = useCallback((json: ShotsCanvas) => {
    // The Fabric save round-trip emits the latest layer/background
    // state. Mirror it back into shell state so subsequent device
    // switches operate on the correct baseline.
    setShots(json);
    startTransition(async () => {
      await saveCanvas(projectId, json);
    });
  }, [projectId]);

  function handleAddText(role: TextRole) {
    canvasRef.current?.addTextLayer(role);
  }

  function handleSetBackground(bg: ShotsBackground) {
    canvasRef.current?.setBackground(bg);
  }

  function handleMoveLayer(id: string, dir: -1 | 1) {
    canvasRef.current?.moveLayer(id, dir);
  }

  function handleToggleVisible(id: string) {
    canvasRef.current?.toggleVisible(id);
  }

  function handleToggleLocked(id: string) {
    canvasRef.current?.toggleLocked(id);
  }

  function handleDeleteLayer(id: string) {
    canvasRef.current?.deleteLayer(id);
  }

  const handleChangeDevice = useCallback((next: DeviceId) => {
    setShots((current) => {
      // Always run through the pure migration helper — it short-circuits
      // when next === current.device (returns same object identity), so
      // a redundant click is a cheap no-op rather than a remount churn.
      const migrated = migrateCanvasToDevice(current, next);
      if (migrated === current) return current;

      // Persist the new dims + rescaled layers. The shell's `handleSave`
      // mirrors back into state, but we set `shots` here first so the
      // FabricCanvas remount sees the new device immediately. The save
      // call is fire-and-forget; if it fails, the local state still
      // reflects what the user asked for (acceptable for a swap action;
      // the next user edit re-triggers save).
      startTransition(async () => {
        await saveCanvas(projectId, migrated);
      });
      return migrated;
    });
  }, [projectId]);

  // Stable canvas key so React knows to remount FabricCanvas cleanly on
  // device change. FabricCanvas's mount effect already includes
  // shots.device in its deps; the key is belt-and-braces for the case
  // where Fabric internals don't tear down cleanly. One projection
  // each render — cheap.
  const canvasKey = useMemo(() => `${projectId}:${shots.device}`, [projectId, shots.device]);

  return (
    <>
      <LeftPanel
        currentDevice={shots.device}
        onChangeDevice={handleChangeDevice}
        onAddText={handleAddText}
        onSetBackground={handleSetBackground}
        layers={layers}
        onMoveLayer={handleMoveLayer}
        onToggleVisible={handleToggleVisible}
        onToggleLocked={handleToggleLocked}
        onDeleteLayer={handleDeleteLayer}
      />
      <div className="flex-1 min-w-0">
        <FabricCanvas
          key={canvasKey}
          ref={canvasRef}
          projectId={projectId}
          initialJson={shots}
          onSave={handleSave}
          onLayersChange={setLayers}
        />
      </div>
      <RightPanel />
    </>
  );
}
