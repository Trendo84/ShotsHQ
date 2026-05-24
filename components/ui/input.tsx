import * as React from "react";
import { cn } from "@/lib/utils/cn";

const baseInput =
  "w-full rounded-[10px] bg-[var(--bg-3)] border border-[var(--line)] text-[var(--fg)] text-[14px] px-3.5 py-2.5 outline-none transition-[border-color,box-shadow,background] focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_18%,transparent)] placeholder:text-[var(--fg-mute)] placeholder:text-[13px] disabled:opacity-50";

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
