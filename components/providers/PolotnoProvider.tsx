"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * Lightweight wrapper that lazily creates a Polotno store and exposes it via
 * context. The actual canvas mount happens inside <PolotnoCanvas />. This
 * provider is intentionally side-effect-free until the canvas component
 * imports the Polotno bundle so SSR stays clean.
 */

type PolotnoContextValue = {
  apiKey: string;
};

const PolotnoContext = createContext<PolotnoContextValue | null>(null);

export function PolotnoProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_POLOTNO_KEY ?? "";
  const value = useMemo(() => ({ apiKey }), [apiKey]);
  return <PolotnoContext.Provider value={value}>{children}</PolotnoContext.Provider>;
}

export function usePolotno() {
  const ctx = useContext(PolotnoContext);
  if (!ctx) throw new Error("usePolotno must be used inside <PolotnoProvider>");
  return ctx;
}
