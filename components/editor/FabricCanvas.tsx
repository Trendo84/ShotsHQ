"use client";

/**
 * The Fabric canvas IS the iPhone screen. Backdrop fills it; text layers
 * sit on it at full-resolution pixel coords (1290×2796 for iPhone 6.9").
 * The red offset-shadow visible around the canvas is brand styling on the
 * wrapper div (boxShadow at the bottom of this file's JSX), NOT a
 * Fabric-rendered device frame. Device-bezel previews for marketing
 * belong on a separate export overlay, not here.
 *
 * See CLAUDE.md → "Editor canvas model" for the full rationale.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Hand, Maximize2, MousePointer2, Save, ZoomIn, ZoomOut } from "lucide-react";
import type { ShotsBackground, ShotsCanvas, TextRole, TextLayer } from "@/lib/canvas/schema";
import { defaultCanvas } from "@/lib/canvas/defaults";
import { resolveTextDispatch, textDefaultsFor } from "@/lib/canvas/dispatch";

// ── Fabric is browser-only — dynamically imported inside useEffect ────────────
type FabricMod = typeof import("fabric");
let _fabricCache: FabricMod | null = null;
async function loadFabric(): Promise<FabricMod> {
  if (!_fabricCache) _fabricCache = await import("fabric");
  return _fabricCache;
}

// ── Custom metadata on Fabric objects (Fabric v7 has no .data in types) ──────
type ObjMeta = {
  id:      string;
  role?:   TextRole;
  kind:    "text" | "background";
  /** Mirrors `TextLayer.system` — placeholder seeded by defaults. */
  system?: boolean;
};
type FabricObjectAny = import("fabric").FabricObject & Record<string, unknown>;
function setMeta(obj: import("fabric").FabricObject, meta: ObjMeta): void {
  (obj as FabricObjectAny)["_shots"] = meta;
}
function getMeta(obj: import("fabric").FabricObject): ObjMeta | undefined {
  return (obj as FabricObjectAny)["_shots"] as ObjMeta | undefined;
}
function patchMeta(obj: import("fabric").FabricObject, patch: Partial<ObjMeta>): void {
  const cur = getMeta(obj);
  if (cur) setMeta(obj, { ...cur, ...patch });
}

// ── Public layer summary for LayersPanel ──────────────────────────────────────

export type LayerSummary = {
  id:      string;
  role:    TextRole | "background";
  label:   string;
  kind:    "text" | "background";
  visible: boolean;
  locked:  boolean;
  system:  boolean;
};

const ROLE_LABEL: Record<TextRole, string> = {
  eyebrow:     "Eyebrow",
  headline:    "Headline",
  subheadline: "Subheadline",
  cta:         "CTA",
};

function summarize(obj: import("fabric").FabricObject): LayerSummary | null {
  const meta = getMeta(obj);
  if (!meta) return null;
  if (meta.kind === "background") {
    return {
      id:      meta.id,
      role:    "background",
      label:   "Backdrop",
      kind:    "background",
      visible: obj.visible !== false,
      locked:  true,
      system:  meta.system === true,
    };
  }
  const role = meta.role ?? "headline";
  return {
    id:      meta.id,
    role,
    label:   ROLE_LABEL[role],
    kind:    "text",
    visible: obj.visible !== false,
    locked:  !(obj.selectable ?? true),
    system:  meta.system === true,
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type FabricCanvasHandle = {
  getCanvasJson:  () => ShotsCanvas;
  addTextLayer:   (role: TextRole) => Promise<void>;
  setBackground:  (bg: ShotsBackground) => Promise<void>;
  deleteSelected: () => void;
  /** Move a non-background layer up (dir=-1, towards user) or down (dir=+1). */
  moveLayer:      (id: string, dir: -1 | 1) => void;
  toggleVisible:  (id: string) => void;
  toggleLocked:   (id: string) => void;
  deleteLayer:    (id: string) => void;
};

type Props = {
  projectId:    string;
  initialJson?: ShotsCanvas | null;
  onSave?:      (json: ShotsCanvas) => void | Promise<void>;
  /** Subscribe to ordered layer summaries — fires on any canvas state change. */
  onLayersChange?: (layers: LayerSummary[]) => void;
};

const DISPLAY_W = 460; // px — canvas display width

// ── Component ─────────────────────────────────────────────────────────────────

export const FabricCanvas = forwardRef<FabricCanvasHandle, Props>(
  function FabricCanvas({ projectId, initialJson, onSave, onLayersChange }, ref) {
    const canvasEl   = useRef<HTMLCanvasElement>(null);
    const fc         = useRef<import("fabric").Canvas | null>(null);
    const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onLayersChangeRef = useRef(onLayersChange);
    onLayersChangeRef.current = onLayersChange;

    const [saving,    setSaving]    = useState<"idle" | "dirty" | "saving">("idle");
    const [tool,      setTool]      = useState<"select" | "pan">("select");
    const [zoomExtra, setZoomExtra] = useState(1);

    const shots    = initialJson ?? defaultCanvas();
    const baseScale = DISPLAY_W / shots.width;
    const scale     = baseScale * zoomExtra;
    const displayH  = Math.round(shots.height * scale);

    // ── Layer-state broadcast ─────────────────────────────────────────────────

    const emitLayers = useCallback(() => {
      const canvas = fc.current;
      if (!canvas) return;
      const summaries: LayerSummary[] = [];
      // Top of the visual stack is the LAST in canvas.getObjects(); reverse so
      // the LayersPanel renders top-to-bottom in user-natural order.
      const objs = [...canvas.getObjects()].reverse();
      for (const obj of objs) {
        const s = summarize(obj);
        if (s) summaries.push(s);
      }
      onLayersChangeRef.current?.(summaries);
    }, []);

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

    // ── Find object by meta id ───────────────────────────────────────────────

    const findById = useCallback((id: string): import("fabric").FabricObject | null => {
      const canvas = fc.current;
      if (!canvas) return null;
      for (const obj of canvas.getObjects()) {
        if (getMeta(obj)?.id === id) return obj;
      }
      return null;
    }, []);

    // ── Fabric init ───────────────────────────────────────────────────────────
    //
    // Deps include `projectId` so opening a different project re-mounts the
    // canvas with that project's state. Without this, switching projects
    // leaves stale Fabric objects on the previous canvas instance.
    //
    // `shots`, `onSave`, `scheduleSave`, `emitLayers` are intentionally
    // captured by the closure (one project = one mount); we don't want
    // re-mount churn on every save round-trip.

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
          setMeta(tb, {
            id:     layer.id,
            role:   layer.role,
            kind:   "text",
            system: layer.system === true,
          });
          canvas.add(tb);
        }

        canvas.renderAll();

        // Save triggers
        canvas.on("object:modified", scheduleSave);
        canvas.on("text:changed",    scheduleSave);

        // First-user-edit flips system → false. After this, the layer is
        // user-authored and won't be replaced on the next dispatch of the
        // same role.
        canvas.on("text:changed", (e) => {
          const target = e.target as import("fabric").FabricObject | undefined;
          if (target && getMeta(target)?.system === true) {
            patchMeta(target, { system: false });
          }
        });

        // Layer-state broadcast — fires on every structural change.
        const broadcast = () => emitLayers();
        canvas.on("object:added",    broadcast);
        canvas.on("object:removed",  broadcast);
        canvas.on("object:modified", broadcast);
        emitLayers(); // initial
      })();

      return () => {
        disposed = true;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        fc.current?.dispose();
        fc.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

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

        // Decide what to do based on existing layers via the pure helper.
        const currentLayers = collectTextLayers(canvas);
        const decision      = resolveTextDispatch(currentLayers, role);

        // FOCUS — don't add a duplicate, select the existing layer instead.
        if (typeof decision !== "string" && decision.kind === "focus") {
          const existing = findById(decision.targetId);
          if (existing) {
            canvas.setActiveObject(existing);
            canvas.renderAll();
          }
          return;
        }

        const { width: w, height: h } = shots;
        const defaults = textDefaultsFor(role, w, h);
        let yPos = defaults.y;

        // STACK — place new CTA below the most recent CTA.
        if (typeof decision !== "string" && decision.kind === "stack") {
          const anchor = findById(decision.afterId);
          if (anchor) {
            const top    = anchor.top    ?? defaults.y;
            const height = anchor.height ?? defaults.fontSize;
            yPos = top + height + 24;
          }
        }

        // REPLACE — remove the system placeholder we're overwriting.
        if (typeof decision !== "string" && decision.kind === "replace") {
          const target = findById(decision.targetId);
          if (target) canvas.remove(target);
        }

        const tb = new fab.Textbox(defaults.content, {
          left:       defaults.x,
          top:        yPos,
          width:      defaults.width,
          fontSize:   defaults.fontSize,
          fontFamily: defaults.fontFamily,
          fontWeight: defaults.fontWeight,
          fill:       defaults.color,
          textAlign:  "center",
          lineHeight: 1.1,
        });
        setMeta(tb, {
          id:     `text-${Date.now()}`,
          role,
          kind:   "text",
          system: false, // user-authored
        });
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

      moveLayer: (id, dir) => {
        const canvas = fc.current;
        if (!canvas) return;
        const obj = findById(id);
        if (!obj) return;
        if (getMeta(obj)?.id === "__bg__") return; // bg stays at the back
        // dir=-1 means "up the visual stack" (towards user) → bringForward
        if (dir === -1) canvas.bringObjectForward(obj);
        else            canvas.sendObjectBackwards(obj);
        canvas.renderAll();
        scheduleSave();
      },

      toggleVisible: (id) => {
        const canvas = fc.current;
        if (!canvas) return;
        const obj = findById(id);
        if (!obj) return;
        obj.set({ visible: !(obj.visible !== false) });
        canvas.renderAll();
        emitLayers();
        scheduleSave();
      },

      toggleLocked: (id) => {
        const canvas = fc.current;
        if (!canvas) return;
        const obj = findById(id);
        if (!obj) return;
        if (getMeta(obj)?.id === "__bg__") return; // already locked
        const nowLocked = obj.selectable ?? true; // currently selectable → lock it
        obj.set({
          selectable:    !nowLocked,
          lockMovementX: nowLocked,
          lockMovementY: nowLocked,
        });
        if (nowLocked && canvas.getActiveObject() === obj) {
          canvas.discardActiveObject();
        }
        canvas.renderAll();
        emitLayers();
        scheduleSave();
      },

      deleteLayer: (id) => {
        const canvas = fc.current;
        if (!canvas) return;
        const obj = findById(id);
        if (!obj) return;
        if (getMeta(obj)?.id === "__bg__") return;
        canvas.remove(obj);
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
          {/* Canvas frame — the red offset shadow is BRAND DECORATION ONLY.
             It is NOT a device frame. See the top-of-file comment + CLAUDE.md. */}
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

/**
 * Read the live Fabric canvas back into a TextLayer[] for the
 * dispatch-resolution helper. Order matches `canvas.getObjects()` (which
 * is bottom-of-stack first).
 */
function collectTextLayers(canvas: import("fabric").Canvas): TextLayer[] {
  const layers: TextLayer[] = [];
  for (const obj of canvas.getObjects()) {
    const meta = getMeta(obj);
    if (!meta || meta.kind !== "text") continue;
    const tb = obj as import("fabric").Textbox;
    layers.push({
      id:         meta.id,
      kind:       "text",
      role:       meta.role ?? "headline",
      content:    tb.text ?? "",
      fontFamily: tb.fontFamily ?? "Inter, sans-serif",
      fontSize:   tb.fontSize ?? 72,
      fontWeight: String(tb.fontWeight ?? "400"),
      color:      typeof tb.fill === "string" ? tb.fill : "#FFFFFF",
      align:      (tb.textAlign as "left" | "center" | "right") ?? "center",
      x:          tb.left ?? 0,
      y:          tb.top  ?? 0,
      width:      tb.width ?? 600,
      visible:    tb.visible !== false,
      locked:     !(tb.selectable ?? true),
      system:     meta.system === true,
    });
  }
  return layers;
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
        // Round-trip the system flag — flipped to false on first user edit
        // by the canvas event handler in the mount effect.
        system:     meta.system === true,
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
