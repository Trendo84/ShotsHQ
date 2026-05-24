"use client";

import * as React from "react";
import { UserButton } from "@clerk/nextjs";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Stable user-affordance slot.
 *
 * Clerk's `<UserButton />` renders different DOM during SSR vs. post-
 * hydration. Rendering it directly produces hydration mismatch warnings
 * on every authenticated route (cycle #6 audit, 2026-05-23).
 *
 * Fix: render a stable placeholder during SSR + first client render,
 * swap to the real widget after `useEffect` fires post-hydration. The
 * placeholder has the exact outer dimensions of UserButton's avatar
 * box, so there's no layout shift.
 */
function UserButtonSlot() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="h-8 w-8 border border-[var(--line-strong)] bg-[var(--bg-2)] grid place-items-center t-mono-xs text-[var(--fg-mute)]"
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
        className="h-8 w-8 border border-[var(--line-strong)] bg-[var(--bg-2)] grid place-items-center t-mono-xs text-[var(--fg-mute)]"
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
          elements: { avatarBox: "h-8 w-8 border border-[var(--line-strong)]" },
        }}
      />
    </div>
  );
}

/**
 * Authenticated app shell topbar.
 *
 * Recovery cycle redesign: this header used to render the section
 * label as 14px text and the breadcrumb as a slash-separated mono
 * trail with "Operator" leading every crumb. Now: the active page
 * is the dominant element (15px semibold), the breadcrumb is a quiet
 * supporting line, and the chrome around the right-side affordances
 * is calmer (no more big bordered buttons).
 *
 * "Operator" as the lead breadcrumb is intentionally not rendered —
 * the call sites still pass it as the first crumb for backwards
 * compat; we filter it out here so the page header reads as product
 * navigation, not admin tooling.
 */
export function Topbar({ section, breadcrumb }: { section: string; breadcrumb?: string[] }) {
  // Filter out the legacy "Operator" lead crumb — the call sites can
  // still pass it for backwards compat; we don't render it.
  const crumbs = (breadcrumb ?? []).filter(
    (c) => c.toLowerCase() !== "operator",
  );

  return (
    <header className="border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-md sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--fg)] truncate leading-none">
            {section}
          </h1>
          {crumbs.length > 0 && (
            <span className="hidden sm:flex text-[12.5px] text-[var(--fg-mute)] truncate items-center leading-none">
              {crumbs.map((b, i) => (
                <span key={i} className="truncate inline-flex items-center">
                  {i > 0 && (
                    <span aria-hidden className="mx-2 text-[var(--fg-mute)] opacity-60">/</span>
                  )}
                  <span className={i === crumbs.length - 1 ? "text-[var(--fg-dim)]" : ""}>
                    {b}
                  </span>
                </span>
              ))}
            </span>
          )}
        </div>

        <div className="flex-1" />

        <ThemeSwitcher compact showLabel={false} />
        <UserButtonSlot />
      </div>
    </header>
  );
}
