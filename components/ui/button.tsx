import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 select-none whitespace-nowrap font-mono uppercase tracking-[0.1em] transition-[background,color,border-color] duration-75 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--bg)] text-[var(--fg)] border border-[var(--line-strong)] hover:bg-[var(--fg)] hover:text-[var(--bg)]",
        accent:  "bg-[var(--accent)] text-[var(--accent-fg)] border border-[var(--accent)] hover:bg-[var(--accent-fg)] hover:text-[var(--accent)]",
        ghost:   "bg-transparent text-[var(--fg)] border border-[var(--line)] hover:bg-[var(--bg-2)]",
        link:    "bg-transparent text-[var(--fg)] underline-offset-4 hover:underline border-0 p-0",
        outline: "bg-transparent text-[var(--fg)] border border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
        destructive: "bg-[var(--accent)] text-[var(--accent-fg)] border border-[var(--accent)] hover:bg-[var(--accent-fg)] hover:text-[var(--accent)]",
      },
      size: {
        sm: "text-[10px] px-3 h-8",
        md: "text-[11px] px-4 h-10",
        lg: "text-[12px] px-5 h-12",
        xl: "text-[13px] px-6 h-14",
        icon: "h-10 w-10 p-0 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
