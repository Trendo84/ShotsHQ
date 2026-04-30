"use client";

import { useState } from "react";

const FRAMES = Array.from({ length: 8 }, (_, i) => ({
  id: `f_${i + 1}`,
  index: i + 1,
  status: i < 5 ? "READY" : i === 5 ? "RENDERING" : "DRAFT",
}));

export function RightPanel() {
  const [active, setActive] = useState<number>(1);
  return (
    <aside className="w-[260px] border-l border-[var(--line)] flex flex-col bg-[var(--bg)]">
      <div className="border-b border-[var(--line)] px-4 py-3 flex items-center justify-between">
        <span className="t-mono-xs text-[var(--accent)]">[ FRAMES · {FRAMES.length} ]</span>
        <button
          type="button"
          disabled
          title="Add frame · coming soon"
          aria-label="Add frame — coming soon"
          className="t-mono-xs text-[var(--fg-mute)] opacity-50 cursor-not-allowed"
        >
          + ADD
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {FRAMES.map((f) => (
          <button
            key={f.id}
            onClick={() => setActive(f.index)}
            className={`w-full grid grid-cols-[42px_1fr] gap-3 border p-2 transition-colors ${
              active === f.index ? "border-[var(--accent)]" : "border-[var(--line)] hover:border-[var(--accent)]"
            }`}
          >
            <div className="aspect-[9/19.5] bg-[var(--bg-2)] flex flex-col items-center justify-center text-center">
              <div className="t-mono-xs text-[var(--fg-mute)]">{String(f.index).padStart(2, "0")}</div>
            </div>
            <div className="text-left flex flex-col justify-between py-1">
              <div className="t-mono-xs text-[var(--fg)]">FRAME {String(f.index).padStart(2, "0")}</div>
              <div className={`t-mono-xs ${f.status === "READY" ? "text-[var(--signal)]" : f.status === "RENDERING" ? "text-[var(--accent)]" : "text-[var(--fg-mute)]"}`}>
                ◯ {f.status}
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="border-t border-[var(--line)] px-4 py-3 t-mono-xs text-[var(--fg-mute)] flex justify-between">
        <span>SELECTED · {String(active).padStart(2, "0")}</span>
        <span>EN</span>
      </div>
    </aside>
  );
}
