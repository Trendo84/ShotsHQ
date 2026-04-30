"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { FabricCanvas, type FabricCanvasHandle, type LayerSummary } from "./FabricCanvas";
import { LeftPanel } from "./EditorPanels";
import { RightPanel } from "./RightPanel";
import { saveCanvas } from "@/app/actions/canvas";
import type { ShotsBackground, ShotsCanvas, TextRole } from "@/lib/canvas/schema";

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
 * Single source of truth: the Fabric canvas. React state is just a
 * projection — every mutation flows through `canvasRef.current.<method>()`,
 * which fires canvas events that update this component's `layers` state.
 */
export function EditorClient({ projectId, projectName: _projectName, initialCanvas }: Props) {
  const canvasRef = useRef<FabricCanvasHandle>(null);
  const [, startTransition] = useTransition();
  const [layers, setLayers] = useState<LayerSummary[]>([]);

  const handleSave = useCallback((json: ShotsCanvas) => {
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

  return (
    <>
      <LeftPanel
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
          ref={canvasRef}
          projectId={projectId}
          initialJson={initialCanvas}
          onSave={handleSave}
          onLayersChange={setLayers}
        />
      </div>
      <RightPanel />
    </>
  );
}
