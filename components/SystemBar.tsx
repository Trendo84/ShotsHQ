"use client";

import { useEffect, useState } from "react";

/**
 * Minimal status bar. Live UTC clock + online indicator, nothing else.
 * Decorative metadata (unit/rev/channel) is drawn on at most one
 * page-specific component (e.g. dashboard topbar) — never globally.
 */
export function SystemBar() {
  const [now, setNow] = useState<string>("--:--");

  useEffect(() => {
    const tick = () => setNow(new Date().toISOString().slice(11, 16) + " UTC");
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border-b border-[var(--line)] bg-[var(--bg)]">
      <div className="px-4 py-1 flex items-center justify-between t-mono-xs text-[var(--fg-mute)]">
        <span className="flex items-center gap-2">
          <span className="block w-1.5 h-1.5 bg-[var(--signal)]" />
          ShotsHQ ® v2.6
        </span>
        <span className="t-numeric">{now}</span>
      </div>
    </div>
  );
}
