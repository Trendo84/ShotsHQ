"use client";

import Link from "next/link";
import { Download, Undo2, Redo2, ArrowLeft } from "lucide-react";

/**
 * Editor chrome — Exit / project label / undo·redo placeholder / Exports.
 *
 * Save state lives in FabricCanvas's status bar (bottom of the canvas),
 * not here. The autosave debounce flushes on object:modified +
 * text:changed events; the user sees "● SAVED / ○ UNSAVED / ↑ SAVING"
 * inline with the canvas they're editing rather than chasing a topbar
 * indicator. Single source of truth.
 *
 * Undo/redo are visible as placeholders so the muscle memory of
 * cmd-Z is honored visually — the actual stack wires up in v1.1.
 */
export function EditorTopbar({ projectId, projectName }: { projectId: string; projectName: string }) {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--bg)] flex items-center">
      <Link
        href={`/projects/${projectId}`}
        className="border-r border-[var(--line)] px-4 py-3 flex items-center gap-2 text-[12px] text-[var(--fg-mute)] hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:bg-[var(--bg-2)]"
      >
        <ArrowLeft size={13} /> Exit
      </Link>
      <div className="px-4 py-3 border-r border-[var(--line)] min-w-[160px]">
        <div className="text-[11px] text-[var(--fg-mute)]">Editing</div>
        <div className="text-[15px] font-medium text-[var(--fg)] leading-tight truncate">
          {projectName}
        </div>
      </div>
      <div className="px-3 py-3 border-r border-[var(--line)] flex items-center gap-2 text-[var(--fg-mute)]">
        <button
          type="button"
          disabled
          className="p-1.5 transition-colors opacity-40 cursor-not-allowed"
          title="Undo · coming soon"
          aria-label="Undo — coming soon"
        >
          <Undo2 size={14} />
        </button>
        <button
          type="button"
          disabled
          className="p-1.5 transition-colors opacity-40 cursor-not-allowed"
          title="Redo · coming soon"
          aria-label="Redo — coming soon"
        >
          <Redo2 size={14} />
        </button>
      </div>
      <div className="flex-1" />
      <div className="px-2 py-2 flex items-center gap-2 border-l border-[var(--line)]">
        <Link
          href={`/projects/${projectId}/exports`}
          title="Exports preview · server render coming soon"
          aria-label="Open exports preview — server render coming soon"
          className="group inline-flex items-center gap-2 border border-[var(--line-strong)] text-[var(--fg)] pl-3 pr-1 py-1 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
        >
          <Download size={12} />
          <span className="btn-label-sm">Exports · preview</span>
          <span className="inline-grid place-items-center w-7 h-7 border-l border-[var(--line-strong)] group-hover:border-[var(--accent)] transition-colors font-bold">
            →
          </span>
        </Link>
      </div>
    </header>
  );
}
