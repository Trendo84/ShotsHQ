"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Hand, Maximize2, MousePointer2, Save, ZoomIn, ZoomOut } from "lucide-react";
import type { ShotsBackground, ShotsCanvas, TextRole } from "@/lib/canvas/schema";
import { defaultCanvas } from "@/lib/canvas/defaults";

// ── Fabric is browser-only — dynamically imported inside useEffect ────────────
type FabricMod = typeof import("fabric");
let _fabricCache: FabricMod | null = null;
async function loadFabric(): Promise<FabricMod> {
  if (!_fabricCache) _fabricCache = await import("fabric");
  return _fabricCache;
}

// ── Custom metadata on Fabric objects (Fabric v7 has no .data in types) ──────
type ObjMeta = { id: string; role?: TextRole; kind: "text" | "background" };
type FabricObjectAny = import("fabric").FabricObject & Record<string, unknown>;
function setMeta(obj: import("fabric").FabricObject, meta: ObjMeta): void {
  (obj as FabricObjectAny)["_shots"] = meta;
}
function getMeta(obj: import("fabric").FabricObject): ObjMeta | undefined {
  return (obj as FabricObjectAny)["_shots"] as ObjMeta | undefined;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type FabricCanvasHandle = {
  getCanvasJson: () => ShotsCanvas;
  addTextLayer:  (role: TextRole) => Promise<void>;
  setBackground: (bg: ShotsBackground) => Promise<void>;
  deleteSelected: () => void;
};

type Props = {
  projectId:    string;
  initialJson?: ShotsCanvas | null;
  onSave?:      (json: ShotsCanvas) => void | Promise<void>;
};

const DISPLAY_W = 460; // px — canvas display width

// ── Component ─────────────────────────────────────────────────────────────────

export const FabricCanvas = forwardRef<FabricCanvasHandle, Props>(
  function FabricCanvas({ projectId, initialJson, onSave }, ref) {
    const canvasEl   = useRef<HTMLCanvasElement>(null);
    const fc         = useRef<import("fabric").Canvas | null>(null);
    const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [saving,    setSaving]    = useState<"idle" | "dirty" | "saving">("idle");
    const [tool,      setTool]      = useState<"select" | "pan">("select");
    const [zoomExtra, setZoomExtra] = useState(1);

    const shots    = initialJson ?? defaultCanvas();
    const baseScale = DISPLAY_W / shots.width;
    const scale     = baseScale * zoomExtra;
    const displayH  = Math.round(shots.height * scale);

    // ── Save ──────────────────────────────────────────────────────────────────

    const flush = useCallback(async () => {
      const canvas = fc.current;
      if (!canvas || !onSave) return;
      setSaving("saving");
      try { await onSave(fabricToShotsJson(canvas, shots)); }
      finally { setSaving("idle"); }
    }, [onSave, shots]);

    const scheduleSave = useCallback(() => {
      setSaving("dirty");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flush, 1500);
    }, [flush]);

    // ── Fabric init ───────────────────────────────────────────────────────────

    useEffect(() => {
      let disposed = false;
      (async () => {
        const fab = await loadFabric();
        if (disposed || !canvasEl.current) return;

        const canvas = new fab.Canvas(canvasEl.current, {
          width:                 DISPLAY_W,
          height:                Math.round(shots.height * baseScale),
          selection:             true,
          preserveObjectStacking: true,
        });
        canvas.setZoom(baseScale);
        fc.current = canvas;

        // Background
        await mountBackground(canvas, shots, fab);

        // Layers
        for (const layer of shots.layers) {
          if (layer.kind !== "text") continue;
          const tb = new fab.Textbox(layer.content, {
            left:          layer.x,
            top:           layer.y,
            width:         layer.width,
            fontSize:      layer.fontSize,
            fontFamily:    layer.fontFamily,
            fontWeight:    layer.fontWeight,
            fill:          layer.color,
            textAlign:     layer.align,
            visible:       layer.visible,
            selectable:    !layer.locked,
            lockMovementX: layer.locked,
            lockMovementY: layer.locked,
            lineHeight:    1.1,
          });
          setMeta(tb, { id: layer.id, role: layer.role, kind: "text" });
          canvas.add(tb);
        }

        canvas.renderAll();
        canvas.on("object:modified", scheduleSave);
        canvas.on("text:changed",    scheduleSave);
      })();

      return () => {
        disposed = true;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        fc.current?.dispose();
        fc.current = null;
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Zoom sync ─────────────────────────────────────────────────────────────

    useEffect(() => {
      const canvas = fc.current;
      if (!canvas) return;
      const s = baseScale * zoomExtra;
      canvas.setZoom(s);
      canvas.setDimensions({
        width:  DISPLAY_W,
        height: Math.round(shots.height * s),
      });
      canvas.renderAll();
    }, [zoomExtra, baseScale, shots.height]);

    // ── Imperative handle ─────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      getCanvasJson: () => fabricToShotsJson(fc.current!, shots),

      addTextLayer: async (role: TextRole) => {
        const fab    = await loadFabric();
        const canvas = fc.current;
        if (!canvas) return;
        const { width: w, height: h } = shots;
        const defaults = textDefaults(role, w, h);
        const tb = new fab.Textbox(defaults.content, {
          left:       defaults.x,
          top:        defaults.y,
          width:      defaults.width,
          fontSize:   defaults.fontSize,
          fontFamily: defaults.fontFamily,
          fontWeight: defaults.fontWeight,
          fill:       defaults.color,
          textAlign:  "center",
          lineHeight: 1.1,
        });
        setMeta(tb, { id: `text-${Date.now()}`, role, kind: "text" });
        canvas.add(tb);
        canvas.setActiveObject(tb);
        canvas.renderAll();
        scheduleSave();
      },

      setBackground: async (bg: ShotsBackground) => {
        const fab    = await loadFabric();
        const canvas = fc.current;
        if (!canvas) return;
        const bgObj = canvas.getObjects().find(
          (o) => getMeta(o)?.id === "__bg__"
        ) as import("fabric").Rect | undefined;
        if (!bgObj) return;
        if (bg.type === "solid") {
          bgObj.set({ fill: bg.color });
        } else if (bg.type === "gradient") {
          bgObj.set({ fill: makeGradient(fab, shots.width, shots.height, bg.colors, bg.angle) });
        }
        canvas.renderAll();
        scheduleSave();
      },

      deleteSelected: () => {
        const canvas = fc.current;
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (!active) return;
        if (getMeta(active)?.id === "__bg__") return;
        canvas.remove(active);
        canvas.renderAll();
        scheduleSave();
      },
    }));

    // ── Render ────────────────────────────────────────────────────────────────

    return (
      <div className="w-full h-full flex flex-col bg-[var(--bg-2)] overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--line)] shrink-0">
          <ToolBtn
            active={tool === "select"}
            onClick={() => { setTool("select"); if (fc.current) fc.current.defaultCursor = "default"; }}
            label="Select"
          >
            <MousePointer2 size={13} />
          </ToolBtn>
          <ToolBtn
            active={tool === "pan"}
            onClick={() => { setTool("pan"); if (fc.current) fc.current.defaultCursor = "grab"; }}
            label="Pan"
          >
            <Hand size={13} />
          </ToolBtn>

          <div className="flex-1" />

          <button
            onClick={() => setZoomExtra((z) => Math.max(0.3, parseFloat((z - 0.15).toFixed(2))))}
            className="p-1.5 border border-[var(--line)] text-[var(--fg-dim)] hover:text-[var(--fg)] hover:bg-[var(--bg)]"
            aria-label="Zoom out"
          >
            <ZoomOut size={12} />
          </button>
          <span className="w-12 text-center t-mono-xs text-[var(--fg-dim)] tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setZoomExtra((z) => Math.min(3, parseFloat((z + 0.15).toFixed(2))))}
            className="p-1.5 border border-[var(--line)] text-[var(--fg-dim)] hover:text-[var(--fg)] hover:bg-[var(--bg)]"
            aria-label="Zoom in"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={() => setZoomExtra(1)}
            className="p-1.5 border border-[var(--line)] text-[var(--fg-dim)] hover:text-[var(--fg)] hover:bg-[var(--bg)]"
            aria-label="Fit canvas"
          >
            <Maximize2 size={12} />
          </button>

          <button
            onClick={flush}
            disabled={saving !== "dirty"}
            className="ml-1 inline-flex items-center gap-1.5 px-2 py-1 border border-[var(--line)] t-mono-xs text-[var(--fg-dim)] hover:text-[var(--fg)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={11} />
            {saving === "saving" ? "Saving…" : saving === "dirty" ? "Save" : "Saved"}
          </button>
        </div>

        {/* Canvas workspace */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-8 relative">
          {/* Dot grid */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(color-mix(in srgb, var(--fg) 12%, transparent) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Canvas frame */}
          <div
            className="relative z-10 shrink-0"
            style={{
              width:     DISPLAY_W,
              height:    displayH,
              boxShadow: "0 24px 80px rgba(0,0,0,0.65), 8px 8px 0 var(--accent)",
            }}
          >
            <canvas ref={canvasEl} />
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 px-3 py-1.5 border-t border-[var(--line)] t-mono-xs text-[var(--fg-mute)] shrink-0">
          <span className="tabular-nums">{shots.width}×{shots.height}</span>
          <span>{shots.device.replace(/_/g, " ").toUpperCase()}</span>
          <span className="text-[9px] border border-[var(--line)] px-1.5 py-0.5">FABRIC JS</span>
          <div className="flex-1" />
          <span
            className={
              saving === "idle"
                ? "text-[var(--signal)]"
                : saving === "dirty"
                ? "text-[var(--fg-dim)]"
                : "text-[var(--accent)]"
            }
          >
            {saving === "idle" ? "● SAVED" : saving === "dirty" ? "○ UNSAVED" : "↑ SAVING"}
          </span>
          <span className="text-[var(--fg-mute)]">proj:{projectId.slice(0, 8)}</span>
        </div>
      </div>
    );
  },
);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function mountBackground(
  canvas: import("fabric").Canvas,
  shots: ShotsCanvas,
  fab: FabricMod,
) {
  const { width: w, height: h, background: bg } = shots;
  let fill: string | import("fabric").Gradient<"linear">;

  if (bg.type === "solid") {
    fill = bg.color;
  } else if (bg.type === "gradient") {
    fill = makeGradient(fab, w, h, bg.colors, bg.angle);
  } else {
    fill = "#0F1117";
  }

  const rect = new fab.Rect({
    left:          0,
    top:           0,
    width:         w,
    height:        h,
    fill,
    selectable:    false,
    evented:       false,
    lockMovementX: true,
    lockMovementY: true,
  });
  setMeta(rect, { id: "__bg__", kind: "background" });
  canvas.add(rect);
  canvas.sendObjectToBack(rect);
  canvas.renderAll();
}

function makeGradient(
  fab:    FabricMod,
  w:      number,
  h:      number,
  colors: [string, string],
  angle:  number,
): import("fabric").Gradient<"linear"> {
  const rad = ((angle - 90) * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const r  = Math.sqrt(cx * cx + cy * cy);
  return new fab.Gradient({
    type:          "linear",
    gradientUnits: "pixels",
    coords: {
      x1: cx - r * Math.cos(rad),
      y1: cy - r * Math.sin(rad),
      x2: cx + r * Math.cos(rad),
      y2: cy + r * Math.sin(rad),
    },
    colorStops: [
      { offset: 0, color: colors[0] },
      { offset: 1, color: colors[1] },
    ],
  });
}

type TextDefaults = {
  content:    string;
  fontFamily: string;
  fontSize:   number;
  fontWeight: string;
  color:      string;
  x:          number;
  y:          number;
  width:      number;
};

function textDefaults(role: TextRole, w: number, h: number): TextDefaults {
  switch (role) {
    case "eyebrow":
      return { content: "APP NAME", fontFamily: "JetBrains Mono, monospace", fontSize: 52, fontWeight: "400", color: "#FF2A2A", x: w * 0.1, y: h * 0.42, width: w * 0.8 };
    case "subheadline":
      return { content: "Supporting copy here", fontFamily: "Inter, sans-serif", fontSize: 58, fontWeight: "400", color: "#B5B5B5", x: w * 0.1, y: h * 0.44, width: w * 0.8 };
    case "cta":
      return { content: "Download Free", fontFamily: "JetBrains Mono, monospace", fontSize: 48, fontWeight: "700", color: "#FF2A2A", x: w * 0.2, y: h * 0.46, width: w * 0.6 };
    default: // headline
      return { content: "New headline", fontFamily: "Archivo Black, sans-serif", fontSize: 130, fontWeight: "900", color: "#FFFFFF", x: w * 0.05, y: h * 0.42, width: w * 0.9 };
  }
}

/** Convert live Fabric canvas state back to our ShotsCanvas JSON. */
function fabricToShotsJson(
  canvas: import("fabric").Canvas,
  original: ShotsCanvas,
): ShotsCanvas {
  let background = original.background;
  const layers: ShotsCanvas["layers"] = [];

  for (const obj of canvas.getObjects()) {
    const meta = getMeta(obj);
    if (!meta?.id) continue;
    const { id } = meta;

    if (id === "__bg__") {
      const r    = obj as import("fabric").Rect;
      const fill = r.fill;
      if (typeof fill === "string") {
        background = { type: "solid", color: fill };
      }
      // Gradient: preserve last-known gradient from original (hard to re-serialize)
      continue;
    }

    if (meta.kind === "text" || obj.type === "textbox") {
      const tb   = obj as import("fabric").Textbox;
      const role = meta.role ?? "headline";
      layers.push({
        id,
        kind:       "text",
        role,
        content:    tb.text ?? "",
        fontFamily: tb.fontFamily ?? "Inter, sans-serif",
        fontSize:   tb.fontSize ?? 72,
        fontWeight: String(tb.fontWeight ?? "400"),
        color:      typeof tb.fill === "string" ? tb.fill : "#FFFFFF",
        align:      (tb.textAlign as "left" | "center" | "right") ?? "center",
        x:          tb.left  ?? 0,
        y:          tb.top   ?? 0,
        width:      tb.width ?? 600,
        visible:    tb.visible !== false,
        locked:     !(tb.selectable ?? true),
      });
    }
  }

  return { ...original, background, layers };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ToolBtn({
  active,
  onClick,
  label,
  children,
}: {
  active:   boolean;
  onClick:  () => void;
  label:    string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`p-2 border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]"
          : "border-[var(--line)] text-[var(--fg-dim)] hover:text-[var(--fg)] hover:bg-[var(--bg)]"
      }`}
    >
      {children}
    </button>
  );
}
