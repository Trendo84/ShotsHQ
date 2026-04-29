"use client";

import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  /** Translate Y in px before reveal. Default 24. */
  y?: number;
  /** Reveal delay in ms. Default 0. */
  delay?: number;
  /** Re-trigger on every entry (default false — reveal once). */
  repeat?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
};

/**
 * IntersectionObserver-driven reveal. GPU-only (transform + opacity).
 * Honors `prefers-reduced-motion` — falls back to instant visibility.
 */
export function Reveal({ children, y = 24, delay = 0, repeat = false, className = "", as: Tag = "div" }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            if (!repeat) obs.unobserve(e.target);
          } else if (repeat) {
            setShown(false);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [repeat]);

  const style: React.CSSProperties = {
    transform: shown ? "translate3d(0,0,0)" : `translate3d(0, ${y}px, 0)`,
    opacity:   shown ? 1 : 0,
    transition: `transform 720ms cubic-bezier(0.32, 0.72, 0, 1) ${delay}ms, opacity 600ms cubic-bezier(0.32, 0.72, 0, 1) ${delay}ms`,
    willChange: shown ? undefined : "transform, opacity",
  };

  // The cast is safe — Tag is a string element name.
  const Component = Tag as React.ElementType;
  return (
    <Component ref={ref as React.RefObject<HTMLElement>} className={className} style={style}>
      {children}
    </Component>
  );
}
