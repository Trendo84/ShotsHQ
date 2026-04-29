"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils/cn";

/**
 * Two-state theme switch. Renders both labels visibly so the user always
 * sees which mode they will swap into. Defaults to tactical.
 */
export function ThemeSwitcher({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="group"
      aria-label="Visual archetype"
      className={cn(
        "inline-flex items-stretch border border-[var(--line-strong)] bg-[var(--bg)]",
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={theme === "tactical"}
        onClick={() => setTheme("tactical")}
        className={cn(
          "t-mono-xs px-2.5 transition-colors",
          compact ? "py-1.5" : "py-2",
          theme === "tactical"
            ? "bg-[var(--accent)] text-[var(--accent-fg)]"
            : "text-[var(--fg-mute)] hover:text-[var(--fg)]",
        )}
      >
        ◉ TACTICAL
      </button>
      <button
        type="button"
        aria-pressed={theme === "swiss"}
        onClick={() => setTheme("swiss")}
        className={cn(
          "t-mono-xs px-2.5 border-l border-[var(--line-strong)] transition-colors",
          compact ? "py-1.5" : "py-2",
          theme === "swiss"
            ? "bg-[var(--accent)] text-[var(--accent-fg)]"
            : "text-[var(--fg-mute)] hover:text-[var(--fg)]",
        )}
      >
        ▢ SWISS
      </button>
    </div>
  );
}
