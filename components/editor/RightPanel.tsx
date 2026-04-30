"use client";

import { useState } from "react";

/**
 * Right rail — frame list.
 *
 * v1: single-frame canvas. The schema (`ShotsCanvas` in `lib/canvas/schema.ts`)
 * has no `frames: ShotsFrame[]` field today — one project = one canvas.
 *
 * The visual structure of this component is intentionally preserved (header
 * row, scrollable card list, footer with selected indicator) so the v1.1
 * multi-frame work is purely additive: replace the const-of-1 below with a
 * real `frames` array driven from `project.polotnoJson.frames`. No layout
 * churn, no re-design.
 *
 * TODO(v1.1): drive FRAMES from real per-frame state. Each frame should own
 * its own background + layers array; switching frames in this rail loads
 * that frame into the canvas. Tracked in `docs/issues/v1.1-multi-frame-canvas.md`
 * — paste into a real GitHub issue when the project tracker is set up.
 *
 * Rendering notes:
 *   - The "+ ADD" button stays disabled with a "Multi-frame coming soon"
 *     tooltip. It's a UI promise, not a working button.
 *   - Status is hardcoded to READY for the single canvas. Once multi-frame
 *     ships, status will reflect actual render-state per frame.
 */

type Frame = { id: string; index: number; status: "READY" };

const FRAMES: Frame[] = [
  { id: "01", index: 1, status: "READY" },
];

export function RightPanel() {
  const [active, setActive] = useState<number>(1);

  return (
    <aside className="w-[260px] border-l border-[var(--line)] flex flex-col bg-[var(--bg)]">
      <div className="border-b border-[var(--line)] px-4 py-3 flex items-center justify-between">
        <span className="t-mono-xs text-[var(--accent)]">[ FRAMES · {FRAMES.length} ]</span>
        <button
          type="button"
          disabled
          title="Multi-frame · per-frame backdrops + layer sets · coming in v1.1"
          aria-label="Add frame — coming in v1.1"
          className="t-mono-xs text-[var(--fg-mute)]/70 opacity-60 cursor-not-allowed text-[10px]"
        >
          + ADD <span className="opacity-70">· soon</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {FRAMES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActive(f.index)}
            aria-pressed={active === f.index}
            className={`w-full grid grid-cols-[42px_1fr] gap-3 border p-2 transition-colors text-left ${
              active === f.index
                ? "border-[var(--accent)]"
                : "border-[var(--line)] hover:border-[var(--accent)]"
            }`}
          >
            <div className="aspect-[9/19.5] bg-[var(--bg-2)] flex flex-col items-center justify-center text-center">
              <div className="t-mono-xs text-[var(--fg-mute)]">
                {String(f.index).padStart(2, "0")}
              </div>
            </div>
            <div className="text-left flex flex-col justify-between py-1">
              <div className="t-mono-xs text-[var(--fg)]">
                FRAME {String(f.index).padStart(2, "0")}
              </div>
              <div className="t-mono-xs text-[var(--signal)]">◯ {f.status}</div>
            </div>
          </button>
        ))}

        {/* Honest about what's next — keeps the rail useful pre-launch
           without faking 8 frames of state. */}
        <div className="border border-dashed border-[var(--line)] p-3 mt-3">
          <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em] mb-2">
            v1.1
          </div>
          <p className="t-mono-xs text-[var(--fg-dim)] leading-relaxed">
            Multi-frame App Store carousels — 5–10 screenshots per device,
            each with its own backdrop and layer set — ship in v1.1.
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--line)] px-4 py-3 t-mono-xs text-[var(--fg-mute)] flex justify-between">
        <span>SELECTED · {String(active).padStart(2, "0")}</span>
        <span>EN</span>
      </div>
    </aside>
  );
}
