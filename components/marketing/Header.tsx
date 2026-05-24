"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { cn } from "@/lib/utils/cn";
import { BrandMark } from "@/components/Brand";

const NAV = [
  { href: "/templates", label: "Templates" },
  { href: "/pricing",   label: "Pricing"   },
  { href: "/docs",      label: "Docs"      },
  { href: "/changelog", label: "Changelog" },
];

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Marketing site header.
 *
 * Redesign 2026-05-24:
 *   - swapped the `SHOTS<accent>HQ</accent>` brutalist wordmark for
 *     the new `<BrandMark>` (glyph + mixed-weight wordmark)
 *   - auth-aware CTA: signed-out users still see "Sign in / Start
 *     free"; signed-in users see "Open app →" instead — fixes the
 *     mismatch where the header asked authenticated users to sign in
 *     again. Uses Clerk's `<SignedIn>` / `<SignedOut>` islands so
 *     the swap is hydration-safe (Clerk renders a stable placeholder
 *     during SSR, then resolves client-side).
 *   - calmer layout: removed the 3-column grid wrapper and the
 *     animated underline scale-x rail (read as a debug indicator on
 *     top of nav links). Active state is now a quiet character-pixel
 *     dot beneath the label.
 *   - dropped the pulsing accent square next to the wordmark.
 */
export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => {
    if (!open && toggleRef.current === document.activeElement) return;
    if (!open) toggleRef.current?.focus({ preventScroll: true });
  }, [open]);

  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--bg)]/70"
      data-marketing-header
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-[var(--accent)] focus:text-[var(--accent-fg)] focus:px-3 focus:py-2 focus:no-underline"
      >
        Skip to content
      </a>

      <div className="max-w-[1480px] mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center text-[var(--fg)] hover:opacity-90 transition-opacity"
          aria-label="ShotsHQ home"
        >
          <BrandMark size="md" />
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-8" aria-label="Marketing">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative px-3 py-1.5 text-[13.5px] transition-colors",
                  active
                    ? "text-[var(--fg)]"
                    : "text-[var(--fg-dim)] hover:text-[var(--fg)]",
                )}
              >
                {n.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-1/2 -translate-x-1/2 bottom-0 block w-1 h-1 rounded-full bg-[var(--accent)]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {HAS_CLERK ? (
            <>
              <SignedOut>
                <Link
                  href="/sign-in"
                  className="hidden md:inline-flex items-center text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] px-3 py-1.5 rounded-md transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  data-marketing-cta="start-free"
                  className="inline-flex items-center gap-1.5 bg-[var(--accent)] text-[var(--accent-fg)] text-[13px] font-semibold px-3.5 py-1.5 rounded-md hover:opacity-90 transition-opacity"
                >
                  Start free
                  <ArrowRight size={13} strokeWidth={2.5} aria-hidden />
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  data-marketing-cta="open-app"
                  className="inline-flex items-center gap-1.5 bg-[var(--accent)] text-[var(--accent-fg)] text-[13px] font-semibold px-3.5 py-1.5 rounded-md hover:opacity-90 transition-opacity"
                >
                  Open app
                  <ArrowRight size={13} strokeWidth={2.5} aria-hidden />
                </Link>
              </SignedIn>
            </>
          ) : (
            <Link
              href="/sign-up"
              data-marketing-cta="start-free"
              className="inline-flex items-center gap-1.5 bg-[var(--accent)] text-[var(--accent-fg)] text-[13px] font-semibold px-3.5 py-1.5 rounded-md hover:opacity-90 transition-opacity"
            >
              Start free
              <ArrowRight size={13} strokeWidth={2.5} aria-hidden />
            </Link>
          )}
          <button
            ref={toggleRef}
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 -mr-2 text-[var(--fg)]"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={cn(
          "md:hidden overflow-hidden transition-[max-height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] border-t border-[var(--line)]",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        {NAV.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center justify-between border-t border-[var(--line)] px-4 py-3 text-[14px] hover:bg-[var(--bg-2)]",
                active ? "text-[var(--fg)]" : "text-[var(--fg-dim)]",
              )}
            >
              <span>{n.label}</span>
              {active && <span aria-hidden className="block w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />}
            </Link>
          );
        })}
        {HAS_CLERK && (
          <>
            <SignedOut>
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="block border-t border-[var(--line)] px-4 py-3 text-[14px] text-[var(--fg-mute)]"
              >
                Sign in
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="block border-t border-[var(--line)] px-4 py-3 text-[14px] text-[var(--accent)] font-semibold"
              >
                Open app →
              </Link>
            </SignedIn>
          </>
        )}
      </div>
    </header>
  );
}
