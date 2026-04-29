import { cn } from "@/lib/utils/cn";

type Props = {
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "thick" | "accent" | "dashed";
  className?: string;
};

export function Separator({ orientation = "horizontal", variant = "default", className }: Props) {
  const v: Record<NonNullable<Props["variant"]>, string> = {
    default: "border-[var(--line)]",
    thick:   "border-[var(--line-strong)] border-t-2",
    accent:  "border-[var(--accent)]",
    dashed:  "border-[var(--line-strong)] border-dashed",
  };
  if (orientation === "vertical") {
    return <div className={cn("h-full w-px self-stretch border-l", v[variant], className)} />;
  }
  return <hr className={cn("w-full border-0 border-t", v[variant], className)} />;
}
