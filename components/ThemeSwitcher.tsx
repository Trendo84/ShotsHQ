"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils/cn";

/**
 * Two-state visual-archetype switch.
 *
 * Both labels are always visible so users see what they'll swap into.
 * The leading "Style:" label + tooltip explain that this changes the
 * site's visual archetype, not just light/dark — without that signpost,
 * users click it, see the layout shift, and are confused.
 */
export function ThemeSwitcher({
  className,
  compact = false,
  showLabel = true,
}: {
  className?: string;
  compact?:   boolean;
  showLabel?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {showLabel && (
        <span
          className="t-mono-xs uppercase tracking-[0.16em] text-[var(--fg-mute)] hidden lg:inline"
          title="ShotsHQ ships in two visual archetypes — Tactical (dark, technical) or Swiss (light, editorial). Swap any time."
        >
          Style
        </span>
      )}
      <div
        role="group"
        aria-label="Visual archetype — Tactical (dark, technical) or Swiss (light, editorial)"
        title="Swap visual archetype. Tactical = dark technical, Swiss = light editorial."
        className="inline-flex items-stretch border border-[var(--line-strong)] bg-[var(--bg)]"
      >
        <button
          type="button"
          aria-pressed={theme === "tactical"}
          onClick={() => setTheme("tactical")}
          title="Tactical — dark, technical, monospace"
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
          title="Swiss — light, editorial, typographic"
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
    </div>
  );
}
