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
 * Progressive-enhancement reveal. Renders visible at rest — the
 * IntersectionObserver-driven animation is purely additive after
 * mount, and only enabled when JS is running AND the user hasn't
 * requested reduced motion.
 *
 * Why this isn't `opacity: 0` at the SSR/initial-paint phase:
 *
 * Before this rewrite, the resting state was `opacity: 0` + `translateY`
 * and the animation flipped it to visible once the IntersectionObserver
 * fired. That meant any user with JS disabled, an intersection-observer
 * timing edge case, prefers-reduced-motion (we did handle this), an
 * ad blocker that broke the script, or a slow client got large blank
 * gaps on the marketing page — the site looked broken on first paint.
 *
 * Now: content is fully visible the moment it enters the DOM. The
 * client component, on mount, marks itself as "ready to animate" (a
 * one-time flag). If the element is not yet in view AND motion is
 * allowed, we drop it back to the pre-animation state and then animate
 * it in when the observer fires. Above-the-fold content (already
 * intersecting at mount) skips the animation entirely and just stays
 * visible — no flash, no hidden state.
 *
 * SSR / no-JS / no-IntersectionObserver paths all keep content visible
 * by default. The animation is a polish layer, not a load-bearing
 * piece of layout.
 */
export function Reveal({ children, y = 24, delay = 0, repeat = false, className = "", as: Tag = "div" }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  /** `null` = no client-side state yet (SSR / pre-mount); render visible. */
  const [hidden, setHidden] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Reduced-motion users always see content immediately, no transitions.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setHidden(false);
      return;
    }
    const node = ref.current;
    if (!node) return;
    // If IntersectionObserver is unavailable, stay visible — the
    // animation polish isn't worth a layout regression.
    if (typeof IntersectionObserver === "undefined") {
      setHidden(false);
      return;
    }

    // Check whether this element is already in view on mount. If it is
    // (above-the-fold), don't animate — just stay visible. If it isn't,
    // drop to the pre-animation state and let the observer reveal it.
    const rect = node.getBoundingClientRect();
    const vh   = window.innerHeight || document.documentElement.clientHeight;
    const inViewAtMount = rect.top < vh * 0.92 && rect.bottom > 0;
    if (inViewAtMount) {
      setHidden(false);
      return;
    }
    setHidden(true);

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setHidden(false);
            if (!repeat) obs.unobserve(e.target);
          } else if (repeat) {
            setHidden(true);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [repeat]);

  // SSR + pre-effect: render visible (hidden === null). After mount we
  // either keep it visible (above-the-fold / reduced-motion / no IO) or
  // hide-then-animate it in for below-the-fold content.
  const style: React.CSSProperties = hidden === true
    ? {
        transform: `translate3d(0, ${y}px, 0)`,
        opacity:   0,
        transition: `transform 720ms cubic-bezier(0.32, 0.72, 0, 1) ${delay}ms, opacity 600ms cubic-bezier(0.32, 0.72, 0, 1) ${delay}ms`,
        willChange: "transform, opacity",
      }
    : hidden === false
      ? {
          transform: "translate3d(0,0,0)",
          opacity:   1,
          transition: `transform 720ms cubic-bezier(0.32, 0.72, 0, 1) ${delay}ms, opacity 600ms cubic-bezier(0.32, 0.72, 0, 1) ${delay}ms`,
        }
      : {
          // SSR / first paint: no transition, just visible.
          opacity: 1,
        };

  // The cast is safe — Tag is a string element name.
  const Component = Tag as React.ElementType;
  return (
    <Component ref={ref as React.RefObject<HTMLElement>} className={className} style={style}>
      {children}
    </Component>
  );
}
