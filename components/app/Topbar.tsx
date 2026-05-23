"use client";

import * as React from "react";
import { UserButton } from "@clerk/nextjs";
import { Search, Bell } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Stable user-affordance slot.
 *
 * Clerk's `<UserButton />` renders different DOM during SSR vs. post-
 * hydration (the widget needs the client-side session to know who
 * the user is and what their avatar URL is). Rendering it directly
 * from a `"use client"` component still goes through SSR — Next.js
 * server-renders the client component once, then hydrates. The DOM
 * shape on those two passes does not match, producing the
 * "Hydration failed because the server rendered HTML didn't match
 * the client" overlay on every authenticated route (cycle #6 audit,
 * 2026-05-23).
 *
 * Fix: render a stable placeholder during SSR + first client render,
 * swap to the real widget after `useEffect` fires post-hydration.
 * The placeholder has the exact outer dimensions of UserButton's
 * avatar box (`h-8 w-8 border`), so there's no layout shift.
 *
 * Same pattern handles the no-Clerk dev environment: if
 * NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is absent, we stay on the
 * placeholder permanently — relabeled with proper a11y.
 */
function UserButtonSlot() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // SSR + pre-hydration placeholder. Aria-hidden because the actual
  // affordance arrives within milliseconds after mount — keeps screen
  // readers from announcing the placeholder text ("OP"). Layout dims
  // match the eventual UserButton + the no-Clerk fallback below so
  // there's no shift.
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

        {/* Search — disabled until /api/search ships. Visual only. */}
        <label
          className="hidden md:flex items-center gap-2 border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1.5 w-72 opacity-60 cursor-not-allowed"
          title="Search · coming soon"
        >
          <Search size={13} className="text-[var(--fg-mute)]" aria-hidden />
          <span className="sr-only">Search projects and exports</span>
          <input
            type="search"
            disabled
            aria-label="Search projects and exports — coming soon"
            placeholder="Search · coming soon"
            className="bg-transparent border-0 p-0 text-[13px] flex-1 outline-none cursor-not-allowed placeholder:normal-case placeholder:tracking-normal placeholder:text-[var(--fg-mute)]"
          />
          <kbd className="t-mono-xs">⌘K</kbd>
        </label>

        <ThemeSwitcher compact showLabel={false} />

        {/* Notifications — disabled until /api/notifications ships */}
        <button
          type="button"
          disabled
          aria-label="Notifications — coming soon"
          title="Notifications · coming soon"
          className="border border-[var(--line)] p-2 text-[var(--fg-mute)] cursor-not-allowed opacity-60 relative"
        >
          <Bell size={14} aria-hidden />
        </button>

        <UserButtonSlot />
      </div>
    </header>
  );
}
