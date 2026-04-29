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
        fixed bottom-0 left-0 right-0 z-40
        border-t border-[var(--line-strong)]
        bg-[var(--bg)]/95 backdrop-blur-md
        transition-transform duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]
        ${visible ? "translate-y-0" : "translate-y-full"}
      `}
    >
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-2.5 flex items-center justify-between gap-4">
        <span className="t-mono-xs uppercase tracking-[0.16em] text-[var(--fg-mute)] hidden sm:flex items-center gap-2 truncate">
          <span className="block w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="truncate">Ship App Store screenshots before coffee.</span>
        </span>

        <span className="sm:hidden t-mono-xs uppercase tracking-[0.16em] text-[var(--fg)] truncate">
          Ship faster.
        </span>

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
            className="group inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-fg)] pl-4 pr-1 py-1.5 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
          >
            <span className="t-mono-xs uppercase tracking-[0.14em] font-semibold">Start free</span>
            <span className="inline-grid place-items-center w-7 h-7 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 leading-none font-bold text-[12px]">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
