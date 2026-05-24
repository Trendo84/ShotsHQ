"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/Brand";
import { AppCta } from "@/components/marketing/AppCta";

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
          className="inline-flex items-center text-[var(--fg)] hover:opacity-90 transition-opacity min-w-0"
          aria-label="ShotsHQ home"
        >
          <BrandMark size="sm" />
        </Link>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/pricing"
            tabIndex={visible ? 0 : -1}
            className="hidden sm:inline text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)] transition-colors px-2 py-1.5"
          >
            Pricing
          </Link>
          <AppCta
            size="sm"
            dataCtaTag="sticky-primary"
            signedOut={{ href: "/sign-up",      label: "Start free"     }}
            signedIn={{  href: "/dashboard",    label: "Open dashboard" }}
          />
        </div>
      </div>
    </div>
  );
}
