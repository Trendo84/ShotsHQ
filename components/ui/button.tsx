import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 select-none whitespace-nowrap rounded-[10px] font-medium tracking-[-0.01em] transition-[background,color,border-color,box-shadow,opacity] duration-150 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_35%,white)]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--bg-3)] text-[var(--fg)] border border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[color-mix(in_srgb,var(--bg-3)_78%,white)]",
        accent:
          "bg-[var(--accent)] text-[var(--accent-fg)] border border-[var(--accent)] hover:opacity-92",
        ghost:
          "bg-transparent text-[var(--fg)] border border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--bg-2)]",
        link:
          "bg-transparent text-[var(--fg)] underline-offset-4 hover:underline border-0 p-0 rounded-none",
        outline:
          "bg-transparent text-[var(--fg)] border border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--fg)] hover:bg-[var(--bg-2)]",
        destructive:
          "bg-transparent text-[#F5B5B5] border border-[color-mix(in_srgb,#DC2626_45%,var(--line))] hover:bg-[color-mix(in_srgb,#DC2626_8%,transparent)]",
      },
      size: {
        sm: "text-[12px] px-3 h-8",
        md: "text-[13px] px-4 h-10",
        lg: "text-[14px] px-5 h-11",
        xl: "text-[15px] px-6 h-12",
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
