import * as React from "react";
import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "accent" | "outline" | "live" | "warn";

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-[var(--bg-3)] text-[var(--fg-dim)] border-[var(--line)]",
    accent: "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]",
    outline: "bg-transparent text-[var(--fg-dim)] border-[var(--line-strong)]",
    live: "bg-[color-mix(in_srgb,var(--signal)_10%,transparent)] text-[var(--signal)] border-[color-mix(in_srgb,var(--signal)_45%,var(--line))]",
    warn: "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_45%,var(--line))]",
  };

  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-[11px] font-medium leading-none tracking-[0.01em]",
        styles[variant],
        className,
      )}
    >
      {variant === "live" && <span className="block h-1.5 w-1.5 rounded-full bg-[var(--signal)] pulse-soft" />}
      {children}
    </span>
  );
}
