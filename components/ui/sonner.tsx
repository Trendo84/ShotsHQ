"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "border border-[var(--line-strong)] bg-[var(--bg)] text-[var(--fg)] p-3 t-mono-sm flex items-start gap-3 w-[340px] shadow-[4px_4px_0_var(--accent)]",
          title: "t-mono-sm",
          description: "t-mono-xs text-[var(--fg-mute)] mt-1",
          actionButton: "btn btn-accent text-[10px] py-1 px-2",
          cancelButton: "btn text-[10px] py-1 px-2",
        },
      }}
      {...props}
    />
  );
}
