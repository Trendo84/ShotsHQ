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
    default: "bg-[var(--bg-2)] text-[var(--fg)] border-[var(--line)]",
    accent:  "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]",
    outline: "bg-transparent text-[var(--fg)] border-[var(--line-strong)]",
    live:    "bg-[var(--bg)] text-[var(--signal)] border-[var(--signal)]",
    warn:    "bg-transparent text-[var(--accent)] border-[var(--accent)]",
  };
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 border t-mono-xs",
        styles[variant],
        className,
      )}
    >
      {variant === "live" && <span className="block w-1.5 h-1.5 bg-[var(--signal)] pulse-soft" />}
      {children}
    </span>
  );
}
