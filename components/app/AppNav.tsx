"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import { BrandMark } from "@/components/Brand";

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Authenticated app navigation — single thin horizontal bar.
 *
 * Structural redesign 2026-05-24:
 *
 * The old shell was a fixed 240px sidebar + a 64px topbar = ~250+px
 * of persistent chrome wrapping every authenticated page. That is
 * exactly the "operator console / left-rail tool" feel the redesign
 * brief flagged. This replaces both with a single 56px nav strip
 * (logo + workspace nav + workspace controls). The shell recedes so
 * the content becomes the stage.
 *
 * Stays available everywhere:
 *   - BrandMark → /dashboard
 *   - Workspace nav: Projects · Billing · Settings
 *   - Credits chip (free users only) → /billing
 *   - "New project" pill CTA
 *   - Clerk UserButton
 *
 * Mobile: nav collapses into a kebab disclosure. Implementation is
 * intentionally minimal — the brief is about structure, not menu UX.
 */

const NAV: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects",  label: "Projects"  },
  { href: "/billing",   label: "Billing"   },
  { href: "/settings",  label: "Settings"  },
];

function UserSlot() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // SSR placeholder — same dims as the eventual UserButton so there's
  // no layout shift. The `data-userbutton-slot` attribute is the
  // e2e gate the hydration-smoke spec waits on; we keep the attribute
  // on every variant so the contract is intact regardless of which
  // branch renders.
  if (!mounted) {
    return (
      <div
        className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-2)] text-[11px] font-medium text-[var(--fg-mute)]"
        aria-hidden
        data-userbutton-slot="placeholder"
      >
        OP
      </div>
    );
  }
  if (!HAS_CLERK) {
    return (
      <div
        className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-2)] text-[11px] font-medium text-[var(--fg-mute)]"
        title="Clerk not configured"
        aria-label="User account placeholder — Clerk not configured"
        data-userbutton-slot="no-clerk"
      >
        OP
      </div>
    );
  }
  return (
    <div data-userbutton-slot="clerk">
      <UserButton
        appearance={{
          elements: { avatarBox: "h-8 w-8 border border-[var(--line)] shadow-none" },
        }}
      />
    </div>
  );
}

export function AppNav({
  creditBalance,
  unmetered = false,
  plan,
}: {
  creditBalance: number;
  unmetered?:    boolean;
  plan:          "Free" | "Studio" | "Lifetime";
}) {
  const pathname = usePathname() ?? "";
  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1480px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          aria-label="ShotsHQ — dashboard"
          className="inline-flex shrink-0 items-center text-[var(--fg)] hover:opacity-90 transition-opacity"
        >
          <BrandMark size="sm" />
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Workspace">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`relative px-3 py-1.5 text-[13.5px] rounded-md transition-colors ${
                  active
                    ? "text-[var(--fg)] bg-[var(--bg-2)]"
                    : "text-[var(--fg-dim)] hover:text-[var(--fg)] hover:bg-[var(--bg-2)]"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Credits chip — free users only. Studio / Lifetime see plan
             label instead of a number; saves space and stops the
             "infinity" symbol from competing with real metrics. */}
          {!unmetered ? (
            <Link
              href="/billing"
              className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] px-2.5 py-1.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] transition-colors"
              aria-label={`${creditBalance} credits remaining — tap to top up`}
            >
              <span className="tabular-nums font-medium text-[var(--fg)]">{creditBalance}</span>
              <span className="text-[10.5px] uppercase tracking-[0.14em] text-[var(--fg-mute)]">cr</span>
            </Link>
          ) : (
            <span className="hidden sm:inline-flex items-center text-[10.5px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium px-2.5 py-1.5 rounded-md border border-[var(--accent)]/40">
              {plan}
            </span>
          )}

          <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 bg-[var(--accent)] text-[var(--accent-fg)] text-[13px] font-semibold px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
          >
            <Plus size={13} strokeWidth={2.5} aria-hidden />
            <span className="hidden sm:inline">New project</span>
          </Link>

          <UserSlot />
        </div>
      </div>

      {/* Mobile nav — hidden on md+; shows as a thin secondary row. */}
      <nav className="md:hidden border-t border-[var(--line)] overflow-x-auto" aria-label="Workspace (mobile)">
        <div className="flex items-center gap-1 px-4 py-2 min-w-max">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-1.5 rounded-md text-[13px] whitespace-nowrap transition-colors ${
                  active
                    ? "text-[var(--fg)] bg-[var(--bg-2)]"
                    : "text-[var(--fg-dim)] hover:text-[var(--fg)]"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
