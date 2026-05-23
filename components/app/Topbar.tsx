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
 * Cycle (overnight polish): the disabled Search input ("Search · coming
 * soon", ⌘K, opacity-60) and the disabled Notifications bell were
 * removed from the prime header slot. They were honest (`disabled`,
 * aria-labelled, title-tipped) but they read as "this app is still
 * being assembled" — exactly the wrong signal on the surface a user
 * sees every single time they log in. Both will return when their
 * back-ends ship (Search has `/api/search` queued; Notifications has
 * a Loops integration in scope).
 *
 * What stays: section label + breadcrumb on the left, theme switcher
 * on the right, the Clerk-backed UserButton. That's the live shell.
 */
export function Topbar({ section, breadcrumb }: { section: string; breadcrumb?: string[] }) {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--bg)]">
      <div className="px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[14px] font-medium text-[var(--fg)] truncate">{section}</span>
          {breadcrumb && breadcrumb.length > 0 && (
            <span className="hidden sm:flex text-[13px] text-[var(--fg-mute)] truncate items-center">
              {breadcrumb.map((b, i) => (
                <span key={i} className="truncate">
                  {i > 0 && <span className="mx-2 opacity-50">/</span>}
                  <span className={i === breadcrumb.length - 1 ? "text-[var(--fg)]" : ""}>{b}</span>
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
