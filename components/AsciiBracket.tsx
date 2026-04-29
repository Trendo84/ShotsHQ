import { cn } from "@/lib/utils/cn";

/**
 * Wraps content in [ … ] style brackets used as syntax decoration.
 * Bracket color is the accent so it punches against monochrome content.
 */
export function AsciiBracket({
  children,
  className,
  open = "[",
  close = "]",
  tight = false,
}: {
  children: React.ReactNode;
  className?: string;
  open?: string;
  close?: string;
  tight?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-baseline", tight ? "gap-1" : "gap-2", className)}>
      <span className="text-[var(--accent)]">{open}</span>
      <span>{children}</span>
      <span className="text-[var(--accent)]">{close}</span>
    </span>
  );
}
