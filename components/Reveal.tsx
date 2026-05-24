"use client";

import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  /** Translate Y in px before reveal. Default 12. */
  y?: number;
  /** Reveal delay in ms. Default 0. */
  delay?: number;
  /** Re-trigger on every entry (default false — reveal once). */
  repeat?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
};

/**
 * Reveal — always-visible-at-rest wrapper with an opt-in entry
 * animation. Recovery-cycle hardening (2026-05-24): previous versions
 * hid below-the-fold content at `opacity: 0` until IntersectionObserver
 * fired, which on production was leaving large blank gaps when IO
 * was slow / blocked / the user scrolled too quickly past the
 * threshold. The cycle-#13 "render visible by default" patch was
 * partially correct but only for above-the-fold elements.
 *
 * The new contract: content is visible at SSR and at every subsequent
 * render. After mount, if motion is allowed AND the element wasn't
 * already in view, we briefly fade-and-translate it in. If anything
 * goes wrong (IO not available, hydration mismatch, JS broken), the
 * content stays visible. There is no path that leaves content hidden.
 */
export function Reveal({ children, y = 12, delay = 0, repeat: _repeat = false, className = "", as: Tag = "div" }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  // `null`  = no client-side state yet (SSR / pre-mount); render visible.
  // `enter` = we've just decided to animate; transient state for one tick.
  // `done`  = animation finished or skipped; content stays visible.
  const [phase, setPhase] = useState<"ssr" | "enter" | "done">("ssr");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("done");
      return;
    }
    const node = ref.current;
    if (!node) {
      setPhase("done");
      return;
    }
    // If the element is already in view at mount, skip the entry
    // animation entirely — keeps the SSR visible state without flicker.
    const rect = node.getBoundingClientRect();
    const vh   = window.innerHeight || document.documentElement.clientHeight;
    const inViewAtMount = rect.top < vh * 0.95 && rect.bottom > 0;
    if (inViewAtMount) {
      setPhase("done");
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setPhase("done");
      return;
    }
    // Below-the-fold: start at the off-state (transient `enter`), then
    // flip to `done` when the element enters the viewport. We do NOT
    // set opacity: 0 — only a small translate offset that resolves to
    // 0 on reveal. If IO never fires, the element is still readable
    // and visible — it just doesn't animate.
    setPhase("enter");
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setPhase("done");
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px 5% 0px" },
    );
    obs.observe(node);
    // Safety fallback: even if IO never fires (cross-origin frame,
    // browser quirk), reveal after 1.2s so nothing stays animated-in
    // for the lifetime of the page.
    const t = window.setTimeout(() => setPhase("done"), 1200);
    return () => {
      obs.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  const style: React.CSSProperties =
    phase === "enter"
      ? {
          transform:  `translate3d(0, ${y}px, 0)`,
          opacity:    0.92,
          transition: `transform 520ms cubic-bezier(0.32, 0.72, 0, 1) ${delay}ms, opacity 320ms ease ${delay}ms`,
          willChange: "transform, opacity",
        }
      : phase === "done"
        ? {
            transform:  "translate3d(0,0,0)",
            opacity:    1,
            transition: `transform 520ms cubic-bezier(0.32, 0.72, 0, 1) ${delay}ms, opacity 320ms ease ${delay}ms`,
          }
        : {
            // SSR / pre-effect — fully visible, no transition. This is
            // the load-bearing state; anything that goes wrong stays
            // here and the user sees the content.
            opacity: 1,
          };

  const Component = Tag as React.ElementType;
  return (
    <Component ref={ref as React.RefObject<HTMLElement>} className={className} style={style}>
      {children}
    </Component>
  );
}
