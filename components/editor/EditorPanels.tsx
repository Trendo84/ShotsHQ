"use client";

import { useState } from "react";
import { Type, Smartphone, Image as ImageIcon, Layers, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CURRENT_DEVICES, groupByFamily, DEVICES_BY_ID } from "@/lib/devices/catalog";
import { findStoreTargetByDimensions } from "@/lib/utils/store-dimensions";
import { DeviceTile } from "@/components/devices/DeviceTile";
import type { DeviceId, ShotsBackground, TextRole } from "@/lib/canvas/schema";
import type { LayerSummary } from "./FabricCanvas";

/**
 * Catalog device IDs are marketing names ("iphone-17-pro-max"), but the
 * persisted canvas schema only knows three storeTarget enum values
 * (iphone_69 / iphone_67 / ipad_13). Map between them at the picker
 * boundary so the panel can render the rich catalog while the canvas
 * stays in the locked App Store dimension classes.
 *
 * The mapping is **data-driven**: we look at the catalog device's
 * Apple-required screenshot dim and find which storeTarget that dim
 * belongs to. So iPhone 17 Pro Max (required 1320×2868) → iphone_67;
 * iPhone 16 Pro Max (required 1290×2796) → iphone_69; every iPad
 * (required 2064×2752) → ipad_13. SE 3 at 1242×2208 doesn't match any
 * locked class — we fall back to the family default. Audit P1-6.
 */
function storeTargetForCatalogId(catalogId: string): DeviceId {
  const d = DEVICES_BY_ID[catalogId];
  if (!d) return "iphone_69";

  const required = d.screenshotDims.find((dim) => dim.required) ?? d.screenshotDims[0];
  if (required) {
    const target = findStoreTargetByDimensions({ width: required.w, height: required.h });
    if (target) return target;
  }
  // Catalog device with no matching locked-class dim (e.g. legacy SE) —
  // fall back to the family's canonical class.
  return d.family === "ipad" ? "ipad_13" : "iphone_69";
}

/**
 * For the panel UI: given the persisted storeTarget enum, find the
 * "default representative" catalog ID to highlight. We pick the
 * highest-tier current-generation device that maps to that class.
 */
function defaultCatalogIdForStoreTarget(target: DeviceId): string {
  switch (target) {
    case "ipad_13":   return "ipad-pro-13-m4";
    case "iphone_67": return "iphone-16-plus";
    case "iphone_69": return "iphone-17-pro-max";
  }
}

const PANELS = [
  { id: "frame",      label: "DEVICE FRAME", icon: Smartphone, code: "01" },
  { id: "background", label: "BACKDROP",     icon: ImageIcon,  code: "02" },
  { id: "text",       label: "TEXT",         icon: Type,       code: "03" },
  { id: "layers",     label: "LAYERS",       icon: Layers,     code: "04" },
  { id: "ai",         label: "AI",           icon: Sparkles,   code: "05" },
];

type LeftPanelProps = {
  /** Currently-active device class for the canvas. Drives FramePanel selection. */
  currentDevice?:   DeviceId;
  /** Called when the user picks a different device from FramePanel. */
  onChangeDevice?:  (device: DeviceId) => void;
  onAddText?:        (role: TextRole) => void;
  onSetBackground?:  (bg: ShotsBackground) => void;
  /** Live ordered layer list from the Fabric canvas — top of stack first. */
  layers?:           LayerSummary[];
  onMoveLayer?:      (id: string, dir: -1 | 1) => void;
  onToggleVisible?:  (id: string) => void;
  onToggleLocked?:   (id: string) => void;
  onDeleteLayer?:    (id: string) => void;
};

export function LeftPanel({
  currentDevice,
  onChangeDevice,
  onAddText,
  onSetBackground,
  layers,
  onMoveLayer,
  onToggleVisible,
  onToggleLocked,
  onDeleteLayer,
}: LeftPanelProps = {}) {
  const [active, setActive] = useState<string>("frame");
  return (
    <aside className="w-[280px] border-r border-[var(--line)] flex flex-col bg-[var(--bg)]">
      <div className="grid grid-cols-5 border-b border-[var(--line)]">
        {PANELS.map((p) => {
          const Icon = p.icon;
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className={cn(
                "py-3 flex flex-col items-center gap-1 t-mono-xs border-r border-[var(--line)] last:border-r-0 transition-colors",
                isActive
                  ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                  : "text-[var(--fg-mute)] hover:text-[var(--fg)]",
              )}
              title={p.label}
            >
              <Icon size={14} />
              <span className="text-[8px]">{p.code}</span>
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {active === "frame"      && (
          <FramePanel
            currentDevice={currentDevice ?? "iphone_69"}
            onChangeDevice={onChangeDevice}
          />
        )}
        {active === "background" && <BackgroundPanel onSetBackground={onSetBackground} />}
        {active === "text"       && <TextPanel onAddText={onAddText} />}
        {active === "layers"     && (
          <LayersPanel
            layers={layers ?? []}
            onMove={onMoveLayer}
            onToggleVisible={onToggleVisible}
            onToggleLocked={onToggleLocked}
            onDelete={onDeleteLayer}
          />
        )}
        {active === "ai"         && <AIPanel />}
      </div>
    </aside>
  );
}

function FramePanel({
  currentDevice,
  onChangeDevice,
}: {
  currentDevice: DeviceId;
  onChangeDevice?: (device: DeviceId) => void;
}) {
  // The visually-highlighted tile mirrors the canvas's actual storeTarget.
  // When the user clicks a different tile, we map back to a storeTarget and
  // call up to the editor shell — which runs `migrateCanvasToDevice` and
  // remounts the Fabric canvas. Without this round-trip, the prior
  // implementation's local-only `setSelected` was a UI lie. Audit P1-6.
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(
    defaultCatalogIdForStoreTarget(currentDevice),
  );
  const [activeFamily, setActiveFamily] = useState<"iphone" | "ipad">(
    currentDevice === "ipad_13" ? "ipad" : "iphone",
  );
  const grouped = groupByFamily(CURRENT_DEVICES);
  const list = grouped[activeFamily];

  function pickDevice(catalogId: string) {
    setSelectedCatalogId(catalogId);
    const target = storeTargetForCatalogId(catalogId);
    if (target !== currentDevice) {
      onChangeDevice?.(target);
    }
  }

  return (
    <>
      <h3 className="t-mono-xs text-[var(--accent)] mb-3">[ DEVICE FRAME ]</h3>
      <div className="inline-flex border border-[var(--line)] divide-x divide-[var(--line)] mb-3">
        {(["iphone", "ipad"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setActiveFamily(f)}
            className={cn(
              "px-3 py-1.5 t-mono-xs uppercase tracking-[0.12em] transition-colors",
              activeFamily === f ? "bg-[var(--fg)] text-[var(--bg)]" : "text-[var(--fg-dim)] hover:text-[var(--fg)]",
            )}
          >
            {f === "iphone" ? "iPhone" : "iPad"}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {list.map((d) => {
          const tileTarget = storeTargetForCatalogId(d.id);
          const matchesCanvas = tileTarget === currentDevice;
          const isSelected = selectedCatalogId === d.id || matchesCanvas;
          return (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => pickDevice(d.id)}
                aria-pressed={isSelected}
                className={cn(
                  "w-full text-left border p-2 transition-colors",
                  isSelected
                    ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                    : "border-[var(--line)] hover:border-[var(--accent)]",
                )}
              >
                <DeviceTile device={d} selected={isSelected} size="sm" showName />
                {d.isStoreRequired && (
                  <div className="text-[9px] uppercase tracking-[0.12em] font-semibold text-[var(--accent)] mt-1.5">Required</div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="t-mono-xs text-[var(--fg-mute)] mt-4 leading-relaxed">
        Picking a device updates the canvas dimensions and rescales layers
        proportionally. We render every selection at the App Store-required
        size for its class on export.
      </p>
    </>
  );
}

const SOLID_COLORS = [
  "#0A0A0A", "#F4F4F0", "#FF2A2A", "#E61919",
  "#4AF626", "#FFC233", "#1A47FF", "#9B59B6",
  "#F39C12", "#16A085", "#34495E", "#7F8C8D",
];

type GradientPreset = { preview: string; bg: ShotsBackground & { type: "gradient" } };
const GRADIENT_PRESETS: GradientPreset[] = [
  { preview: "linear-gradient(180deg, #FF2A2A, #0A0A0A)", bg: { type: "gradient", colors: ["#FF2A2A", "#0A0A0A"], angle: 180 } },
  { preview: "linear-gradient(180deg, #4AF626, #0A0A0A)", bg: { type: "gradient", colors: ["#4AF626", "#0A0A0A"], angle: 180 } },
  { preview: "linear-gradient(45deg,  #FFC233, #FF2A2A)", bg: { type: "gradient", colors: ["#FFC233", "#FF2A2A"], angle: 45  } },
  { preview: "linear-gradient(0deg,   #F4F4F0, #EAE8E3)", bg: { type: "gradient", colors: ["#F4F4F0", "#EAE8E3"], angle: 0   } },
  { preview: "linear-gradient(180deg, #1A47FF, #0A0A0A)", bg: { type: "gradient", colors: ["#1A47FF", "#0A0A0A"], angle: 180 } },
  { preview: "linear-gradient(180deg, #9B59B6, #0A0A0A)", bg: { type: "gradient", colors: ["#9B59B6", "#0A0A0A"], angle: 180 } },
];

function BackgroundPanel({ onSetBackground }: { onSetBackground?: (bg: ShotsBackground) => void }) {
  return (
    <>
      <h3 className="t-mono-xs text-[var(--accent)] mb-3">[ BACKDROP ]</h3>
      <div>
        <div className="t-mono-xs text-[var(--fg-mute)] mb-2">SOLID</div>
        <div className="grid grid-cols-6 gap-1">
          {SOLID_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onSetBackground?.({ type: "solid", color: c })}
              className="aspect-square border border-[var(--line)] hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      </div>
      <div className="mt-5">
        <div className="t-mono-xs text-[var(--fg-mute)] mb-2">GRADIENT</div>
        <div className="grid grid-cols-3 gap-1">
          {GRADIENT_PRESETS.map((g, i) => (
            <button
              key={i}
              onClick={() => onSetBackground?.(g.bg)}
              className="aspect-[3/4] border border-[var(--line)] hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
              style={{ background: g.preview }}
            />
          ))}
        </div>
      </div>
      <div className="mt-5 border-t border-[var(--line)] pt-4">
        <div className="t-mono-xs text-[var(--fg-mute)] mb-2">AI GENERATE</div>
        <button
          type="button"
          disabled
          title="Flux 2 backdrop · coming soon"
          aria-label="Flux 2 AI backdrop — coming soon"
          className="btn w-full text-[10px] py-2 opacity-40 cursor-not-allowed"
        >
          ▸ FLUX 2 BACKDROP · SOON
        </button>
      </div>
    </>
  );
}

const TEXT_PRESETS: { role: TextRole; label: string; preview: string; sub: string }[] = [
  { role: "headline",    label: "DISPLAY",   preview: "t-display text-[20px] leading-tight",    sub: "ARCHIVO BLACK · 130PX" },
  { role: "eyebrow",     label: "EYEBROW",   preview: "font-mono text-[var(--accent)] text-[13px] tracking-widest uppercase", sub: "JETBRAINS MONO · 52PX" },
  { role: "subheadline", label: "SUBHEAD",   preview: "font-sans text-[15px] text-[var(--fg-dim)]", sub: "INTER · 58PX" },
  { role: "cta",         label: "CTA BADGE", preview: "font-mono text-[12px] text-[var(--accent)] uppercase tracking-wider", sub: "JETBRAINS MONO · 48PX" },
];

function TextPanel({ onAddText }: { onAddText?: (role: TextRole) => void }) {
  return (
    <>
      <h3 className="t-mono-xs text-[var(--accent)] mb-3">[ TEXT LAYERS ]</h3>
      <div className="space-y-2">
        {TEXT_PRESETS.map((p) => (
          <button
            key={p.role}
            onClick={() => onAddText?.(p.role)}
            className="w-full text-left border border-[var(--line)] hover:border-[var(--accent)] p-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
          >
            <div className={p.preview}>{p.label}</div>
            <div className="t-mono-xs text-[var(--fg-mute)] mt-1">{p.sub} · CLICK TO ADD</div>
          </button>
        ))}
      </div>
      <p className="t-mono-xs text-[var(--fg-mute)] mt-4 leading-relaxed">
        Click a style to add a new text layer. Double-click the layer on canvas to edit.
      </p>
    </>
  );
}

/**
 * LayersPanel — reads real Fabric canvas state via the `layers` prop and
 * dispatches mutations through callbacks. Replaces the previous mock
 * INITIAL_LAYERS that never reflected the actual render.
 *
 * Layer order mirrors `canvas.getObjects()` reversed: top-of-stack first
 * (matching natural top-to-bottom reading order in the panel).
 */
type LayerLabelType = "TXT" | "BG";

function layerType(kind: LayerSummary["kind"]): LayerLabelType {
  return kind === "background" ? "BG" : "TXT";
}

function LayersPanel({
  layers,
  onMove,
  onToggleVisible,
  onToggleLocked,
  onDelete,
}: {
  layers:          LayerSummary[];
  onMove?:         (id: string, dir: -1 | 1) => void;
  onToggleVisible?: (id: string) => void;
  onToggleLocked?: (id: string) => void;
  onDelete?:       (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <h3 className="t-mono-xs text-[var(--accent)] mb-3">[ LAYERS · {layers.length} ]</h3>
      {layers.length === 0 && (
        <p className="t-mono-xs text-[var(--fg-mute)] leading-relaxed">
          Canvas is empty. Add a backdrop or a text layer from the panels above.
        </p>
      )}
      <ul className="font-mono text-[11px] space-y-px">
        {layers.map((l, i) => {
          const isSel = selected === l.id;
          const isBg  = l.kind === "background";
          return (
            <li
              key={l.id}
              className={cn(
                "flex items-center gap-1.5 py-1.5 px-1.5 transition-colors",
                isSel
                  ? "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border-l-2 border-[var(--accent)]"
                  : "border-l-2 border-transparent hover:bg-[var(--bg-2)]",
                !l.visible && "opacity-40",
              )}
            >
              <button
                type="button"
                onClick={() => onToggleVisible?.(l.id)}
                aria-label={l.visible ? "Hide layer" : "Show layer"}
                className="text-[var(--fg-dim)] hover:text-[var(--fg)] w-4 shrink-0"
                title={l.visible ? "Hide" : "Show"}
              >
                {l.visible ? "◉" : "○"}
              </button>
              <button
                type="button"
                onClick={() => setSelected(l.id)}
                className="flex-1 text-left flex items-center gap-2 min-w-0"
              >
                <span className="text-[var(--accent)] shrink-0">[{layerType(l.kind)}]</span>
                <span className="text-[var(--fg)] truncate">{l.label}</span>
                {l.system && (
                  <span
                    className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em] shrink-0 text-[9px]"
                    title="Placeholder — replaced when you add this role"
                  >
                    DEFAULT
                  </span>
                )}
              </button>
              <div className="flex items-center gap-px shrink-0">
                <button
                  type="button"
                  onClick={() => onMove?.(l.id, -1)}
                  disabled={i === 0 || isBg}
                  aria-label="Move layer up"
                  className="text-[var(--fg-mute)] hover:text-[var(--fg)] px-1 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onMove?.(l.id, 1)}
                  disabled={i === layers.length - 1 || isBg}
                  aria-label="Move layer down"
                  className="text-[var(--fg-mute)] hover:text-[var(--fg)] px-1 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onToggleLocked?.(l.id)}
                  disabled={isBg}
                  aria-label={l.locked ? "Unlock layer" : "Lock layer"}
                  className="text-[var(--fg-mute)] hover:text-[var(--fg)] px-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  title={isBg ? "Backdrop is locked" : l.locked ? "Unlock" : "Lock"}
                >
                  {l.locked ? "⊠" : "⊡"}
                </button>
                {!l.locked && !isBg && (
                  <button
                    type="button"
                    onClick={() => onDelete?.(l.id)}
                    aria-label="Delete layer"
                    className="text-[var(--fg-mute)] hover:text-[var(--accent)] px-1"
                    title="Delete"
                  >
                    ✕
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        disabled
        title="Layer kinds beyond text · coming soon"
        aria-label="Add layer — coming soon"
        className="mt-3 w-full border border-dashed border-[var(--line-strong)] text-[var(--fg-mute)]/70 py-2 t-mono-xs uppercase tracking-[0.14em] opacity-40 cursor-not-allowed"
      >
        + Add Layer · soon
      </button>
    </>
  );
}

function AIPanel() {
  return (
    <>
      <h3 className="t-mono-xs text-[var(--accent)] mb-3">[ AI MODULES ]</h3>
      <div className="space-y-2">
        {[
          { label: "GENERATE COPY",   sub: "GPT-5 · 1 CR / GEN",  variant: "accent" as const },
          { label: "GENERATE BG",     sub: "FLUX 2 · 2 CR / GEN", variant: "default" as const },
          { label: "RESTYLE FROM REF",sub: "FLUX 2 · 3 CR / GEN", variant: "default" as const },
          { label: "TRANSLATE × 41",  sub: "GPT-5 · 1 CR / LOC",  variant: "default" as const },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            disabled
            title={`${b.label.toLowerCase()} · coming soon`}
            aria-label={`${b.label} — coming soon`}
            className="w-full text-left border border-[var(--line)] p-3 opacity-40 cursor-not-allowed"
          >
            <div className="t-mono-sm">{b.label} <span className="text-[var(--fg-mute)]/70">· soon</span></div>
            <div className="t-mono-xs opacity-70 mt-1">{b.sub}</div>
          </button>
        ))}
      </div>
      <div className="mt-5 border-t border-[var(--line)] pt-4 t-mono-xs text-[var(--fg-mute)] leading-relaxed">
        ALL AI CALLS DISPATCH TO TRIGGER.DEV. PROGRESS STREAMS VIA
        useRealtimeRun. FAILED CALLS REFUND CREDITS AUTOMATICALLY.
      </div>
    </>
  );
}
