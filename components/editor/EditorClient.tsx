"use client";

import { useRef, useTransition } from "react";
import { FabricCanvas, type FabricCanvasHandle } from "./FabricCanvas";
import { LeftPanel } from "./EditorPanels";
import { RightPanel } from "./RightPanel";
import { saveCanvas } from "@/app/actions/canvas";
import type { ShotsBackground, ShotsCanvas, TextRole } from "@/lib/canvas/schema";

type Props = {
  projectId:     string;
  projectName:   string;
  initialCanvas: ShotsCanvas | null;
};

export function EditorClient({ projectId, projectName: _projectName, initialCanvas }: Props) {
  const canvasRef = useRef<FabricCanvasHandle>(null);
  const [, startTransition] = useTransition();

  function handleSave(json: ShotsCanvas) {
    startTransition(async () => {
      await saveCanvas(projectId, json);
    });
  }

  function handleAddText(role: TextRole) {
    canvasRef.current?.addTextLayer(role);
  }

  function handleSetBackground(bg: ShotsBackground) {
    canvasRef.current?.setBackground(bg);
  }

  return (
    <>
      <LeftPanel onAddText={handleAddText} onSetBackground={handleSetBackground} />
      <div className="flex-1 min-w-0">
        <FabricCanvas
          ref={canvasRef}
          projectId={projectId}
          initialJson={initialCanvas}
          onSave={handleSave}
        />
      </div>
      <RightPanel />
    </>
  );
}
