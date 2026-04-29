"use client";

import Link from "next/link";
import { Save, Download, Undo2, Redo2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EditorTopbar({ projectId, projectName }: { projectId: string; projectName: string }) {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--bg)] flex items-center">
      <Link
        href={`/projects/${projectId}`}
        className="border-r border-[var(--line)] px-4 py-3 flex items-center gap-2 text-[12px] text-[var(--fg-mute)] hover:text-[var(--accent)] transition-colors"
      >
        <ArrowLeft size={13} /> Exit
      </Link>
      <div className="px-4 py-3 border-r border-[var(--line)] min-w-[160px]">
        <div className="text-[11px] text-[var(--fg-mute)]">Editing</div>
        <div className="text-[15px] font-medium text-[var(--fg)] leading-tight">{projectName}</div>
      </div>
      <div className="px-3 py-3 border-r border-[var(--line)] flex items-center gap-2 text-[var(--fg-mute)]">
        <button
          className="p-1.5 hover:text-[var(--accent)] hover:bg-[var(--bg-2)] transition-colors"
          title="Undo (⌘Z)"
          aria-label="Undo"
        >
          <Undo2 size={14} />
        </button>
        <button
          className="p-1.5 hover:text-[var(--accent)] hover:bg-[var(--bg-2)] transition-colors"
          title="Redo (⌘⇧Z)"
          aria-label="Redo"
        >
          <Redo2 size={14} />
        </button>
      </div>
      <div className="flex-1 px-4 text-[12px] text-[var(--signal)] flex items-center gap-2">
        <span className="block w-1.5 h-1.5 rounded-full bg-[var(--signal)] pulse-soft" />
        Autosaved
      </div>
      <div className="px-2 py-2 flex items-center gap-2 border-l border-[var(--line)]">
        <Button variant="ghost" size="sm" className="text-[11px] tracking-[0.04em] normal-case">
          <Save size={12} /> Save
        </Button>
        <Link
          href={`/projects/${projectId}/exports`}
          className="group inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-fg)] pl-3 pr-1 py-1 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
        >
          <Download size={12} />
          <span className="btn-label-sm">Export</span>
          <span className="inline-grid place-items-center w-7 h-7 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform group-hover:translate-x-0.5 font-bold">
            →
          </span>
        </Link>
      </div>
    </header>
  );
}
