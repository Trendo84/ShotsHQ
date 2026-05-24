"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils/cn";

export function ThemeSwitcher({
  className,
  compact = false,
  showLabel = true,
}: {
  className?: string;
  compact?: boolean;
  showLabel?: boolean;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {showLabel && (
        <span
          className="hidden lg:inline text-[12px] text-[var(--fg-mute)]"
          title="Choose the look you prefer."
        >
          Theme
        </span>
      )}

      <div
        role="group"
        aria-label="Theme"
        className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--bg-2)] p-1"
      >
        <button
          type="button"
          aria-pressed={theme === "tactical"}
          onClick={() => setTheme("tactical")}
          title="Dark theme"
          className={cn(
            "rounded-full px-3 text-[12px] font-medium transition-colors",
            compact ? "py-1.5" : "py-2",
            theme === "tactical"
              ? "bg-[var(--fg)] text-[var(--bg)]"
              : "text-[var(--fg-mute)] hover:text-[var(--fg)]",
          )}
        >
          Dark
        </button>
        <button
          type="button"
          aria-pressed={theme === "swiss"}
          onClick={() => setTheme("swiss")}
          title="Light theme"
          className={cn(
            "rounded-full px-3 text-[12px] font-medium transition-colors",
            compact ? "py-1.5" : "py-2",
            theme === "swiss"
              ? "bg-[var(--fg)] text-[var(--bg)]"
              : "text-[var(--fg-mute)] hover:text-[var(--fg)]",
          )}
        >
          Light
        </button>
      </div>
    </div>
  );
}
