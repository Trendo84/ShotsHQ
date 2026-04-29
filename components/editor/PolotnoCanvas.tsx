"use client";

import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, Hand, MousePointer2, Save } from "lucide-react";

/**
 * Polotno canvas mount point. The actual SDK is heavy (~10MB) and paid,
 * so we don't import it here — wire it up in a separate file gated by
 * the license env var (`components/editor/PolotnoMount.tsx`), and
 * dynamically render it in place of this placeholder when the key
 * exists.
 *
 * In dev without a license we render an instrumented placeholder that
 * still feels like an editor — pan/zoom, ruler, snap-to-grid affordances,
 * frame placeholder, and selection state.
 */
export function PolotnoCanvas({ projectId }: { projectId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [tool, setTool] = useState<"select" | "pan">("select");
  const [selected, setSelected] = useState<string | null>("headline");
  const [autosaveTick, setAutosaveTick] = useState(0);

  // Fake an autosave heartbeat so the UI feels alive.
  useEffect(() => {
    const t = setInterval(() => setAutosaveTick((n) => n + 1), 4500);
    return () => clearInterval(t);
  }, []);

  // Wheel/pinch zoom (capped) — ergonomic if you have a real surface.
  function onWheel(e: React.WheelEvent) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => Math.max(25, Math.min(400, z - Math.sign(e.deltaY) * 5)));
  }

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      className="w-full h-full bg-[var(--bg-2)] relative grid place-items-center overflow-hidden select-none"
    >
      {/* Workspace grid — dotted at intersections */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in srgb, var(--fg) 18%, transparent) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.5,
        }}
      />
      {/* Center crosshair */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-[color-mix(in_srgb,var(--accent)_30%,transparent)]" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[color-mix(in_srgb,var(--accent)_30%,transparent)]" />
      </div>

      {/* The canvas frame — represents the App Store screenshot */}
      <div
        className="relative z-10 aspect-[9/19.5] border-2 border-[var(--line-strong)] bg-[var(--bg)] shadow-[8px_8px_0_var(--accent)] flex flex-col transition-transform"
        style={{
          height: `${78 * (zoom / 100)}%`,
          maxHeight: "92%",
        }}
      >
        {/* Status bar */}
        <div className="border-b border-[var(--line)] px-3 py-1.5 flex items-center justify-between t-mono-xs">
          <span className="text-[var(--fg-mute)]">9:41</span>
          <span
            className="block h-3 w-12"
            style={{ background: "var(--fg)", opacity: 0.7, borderRadius: 9999 }}
          />
          <span className="text-[var(--fg-mute)]">5G ●●●</span>
        </div>

        {/* Composition area */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-2 relative">
          <div className="t-mono-xs text-[var(--fg-mute)] absolute top-3 left-3">
            PROJECT · {projectId.toUpperCase()}
          </div>
          <div className="t-mono-xs text-[var(--accent)] absolute top-3 right-3">
            FRAME 01 · EN
          </div>

          {/* Selectable layers */}
          <SelectableLayer
            id="eyebrow"
            selected={selected}
            onSelect={setSelected}
            className="mb-1"
          >
            <span className="t-eyebrow t-eyebrow-accent">Surf · forecast</span>
          </SelectableLayer>

          <SelectableLayer id="headline" selected={selected} onSelect={setSelected}>
            <h2 className="t-display text-[clamp(2rem,5vw,3rem)] leading-[0.85]">
              Catch the<br />
              <span className="text-[var(--accent)]">perfect set.</span>
            </h2>
          </SelectableLayer>

          <SelectableLayer id="subline" selected={selected} onSelect={setSelected}>
            <p className="t-mono-sm text-[var(--fg-dim)] mt-2">
              Wave height · Wind · Tide window
            </p>
          </SelectableLayer>

          <SelectableLayer id="phone" selected={selected} onSelect={setSelected} className="mt-4">
            <div className="w-32 h-44 border border-[var(--line-strong)] bg-[var(--bg-2)] grid place-items-center">
              <span className="t-mono-xs text-[var(--fg-mute)]">phone preview</span>
            </div>
          </SelectableLayer>
        </div>

        {/* Footer ruler */}
        <div className="border-t border-[var(--line)] px-3 py-2 flex justify-between t-mono-xs text-[var(--fg-mute)]">
          <span className="tabular-nums">1290 × 2796</span>
          <span className={autosaveTick % 2 === 0 ? "text-[var(--signal)]" : "text-[var(--fg-dim)]"}>
            ◉ Autosave · {autosaveTick}s ago
          </span>
        </div>
      </div>

      {/* Top-left mock-mode pill */}
      <div className="absolute top-3 left-3 z-20 t-mono-xs text-[var(--fg-mute)] border border-[var(--line-strong)] bg-[var(--bg)] px-2 py-1">
        Polotno · placeholder · no license loaded
      </div>

      {/* Tool palette (left, vertical) */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col border border-[var(--line-strong)] bg-[var(--bg)] divide-y divide-[var(--line)]">
        <ToolButton active={tool === "select"} onClick={() => setTool("select")} label="Select (V)">
          <MousePointer2 size={14} />
        </ToolButton>
        <ToolButton active={tool === "pan"} onClick={() => setTool("pan")} label="Pan (H)">
          <Hand size={14} />
        </ToolButton>
      </div>

      {/* Bottom-right zoom + save */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 t-mono-xs">
        <button
          onClick={() => setZoom((z) => Math.max(25, z - 10))}
          className="border border-[var(--line-strong)] bg-[var(--bg)] p-1.5 hover:bg-[var(--bg-2)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
          aria-label="Zoom out"
        >
          <ZoomOut size={12} />
        </button>
        <span className="text-[var(--fg-dim)] tabular-nums w-10 text-center">{zoom}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(400, z + 10))}
          className="border border-[var(--line-strong)] bg-[var(--bg)] p-1.5 hover:bg-[var(--bg-2)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
          aria-label="Zoom in"
        >
          <ZoomIn size={12} />
        </button>
        <button
          onClick={() => setZoom(100)}
          className="border border-[var(--line-strong)] bg-[var(--bg)] p-1.5 hover:bg-[var(--bg-2)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
          aria-label="Reset zoom"
        >
          <Maximize2 size={12} />
        </button>
        <span className="ml-2 text-[var(--fg-mute)] tabular-nums">⌘+/− to zoom</span>
      </div>

      {/* Top-right save shortcut */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 t-mono-xs">
        <button
          className="inline-flex items-center gap-1.5 border border-[var(--line-strong)] bg-[var(--bg)] px-2 py-1 hover:bg-[var(--bg-2)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
          aria-label="Save snapshot"
        >
          <Save size={11} /> ⌘S
        </button>
      </div>
    </div>
  );
}

function SelectableLayer({
  id,
  selected,
  onSelect,
  children,
  className = "",
}: {
  id: string;
  selected: string | null;
  onSelect: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const isSel = selected === id;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      className={`relative ${className} ${isSel ? "ring-1 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]" : "hover:ring-1 hover:ring-[var(--line-strong)] hover:ring-offset-1 hover:ring-offset-[var(--bg)]"}`}
    >
      {children}
      {isSel && (
        <span
          aria-hidden
          className="absolute -top-2 -left-2 t-mono-xs text-[9px] uppercase tracking-[0.14em] font-semibold bg-[var(--accent)] text-[var(--accent-fg)] px-1"
        >
          {id}
        </span>
      )}
    </button>
  );
}

function ToolButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`p-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
        active ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--fg-dim)] hover:text-[var(--fg)] hover:bg-[var(--bg-2)]"
      }`}
    >
      {children}
    </button>
  );
}
