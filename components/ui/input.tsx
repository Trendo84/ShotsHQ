import * as React from "react";
import { cn } from "@/lib/utils/cn";

const baseInput =
  "w-full bg-[var(--bg-2)] border border-[var(--line)] text-[var(--fg)] text-[14px] px-3 py-2.5 outline-none transition-colors focus:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)] placeholder:text-[var(--fg-dim)] placeholder:text-[13px] disabled:opacity-50";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input ref={ref} type={type} className={cn(baseInput, className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(baseInput, "resize-none", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";
