"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Slim sticky CTA bar that appears after the user has scrolled past the
 * hero. Restores access to the primary action on a long landing page.
 *
 * Hides itself on the /sign-up and /sign-in routes (where it would be
 * redundant) — but those routes are auth-only, so the bar lives in the
 * marketing layout above them and never renders there.
 *
 * Honors prefers-reduced-motion (skips the slide-up entry animation).
 */
export function StickyCtaBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`
        hidden md:block
        fixed bottom-0 left-0 right-0 z-40
        border-t border-[var(--line-strong)]
        bg-[var(--bg)]/92 backdrop-blur-xl
        shadow-[0_-12px_32px_-12px_rgba(0,0,0,0.55)]
        transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]
        ${visible ? "translate-y-0" : "translate-y-full"}
      `}
    >
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-2.5 flex items-center justify-between gap-4">
        <Link
          href="/"
          tabIndex={visible ? 0 : -1}
          className="hidden sm:flex items-center gap-2 group min-w-0"
          aria-label="ShotsHQ home"
        >
          <span className="block w-2 h-2 bg-[var(--accent)] shrink-0" />
          <span className="t-display text-[15px] tracking-[-0.04em] leading-none">
            SHOTS<span className="text-[var(--accent)]">HQ</span>
          </span>
          <sup className="t-mono-xs text-[var(--fg-mute)] hidden md:inline">®</sup>
          <span className="t-mono-xs text-[var(--fg-mute)] tracking-[0.16em] uppercase ml-2 truncate">
            · Free forever
          </span>
        </Link>

        <Link
          href="/"
          tabIndex={visible ? 0 : -1}
          className="sm:hidden flex items-center gap-2 min-w-0"
          aria-label="ShotsHQ home"
        >
          <span className="block w-2 h-2 bg-[var(--accent)] shrink-0" />
          <span className="t-display text-[14px] tracking-[-0.04em] leading-none">
            SHOTS<span className="text-[var(--accent)]">HQ</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/pricing"
            tabIndex={visible ? 0 : -1}
            className="hidden sm:inline text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)] transition-colors px-2 py-1.5"
          >
            Pricing
          </Link>
          <Link
            href="/sign-up"
            tabIndex={visible ? 0 : -1}
            className="group relative inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-fg)] pl-4 pr-1 py-1.5 overflow-hidden transition-all duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] hover:shadow-[0_8px_24px_-8px_var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            {/* Shimmer sweep on hover — pure transform, GPU-only */}
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[var(--accent-fg)]/12 to-transparent transition-transform duration-[700ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-full pointer-events-none"
            />
            <span className="relative t-mono-xs uppercase tracking-[0.14em] font-semibold">Start free</span>
            <span className="relative inline-grid place-items-center w-7 h-7 bg-[var(--accent-fg)] text-[var(--accent)] transition-all duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-px leading-none font-bold text-[12px]">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
