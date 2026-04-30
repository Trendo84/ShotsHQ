"use client";

import { UserButton } from "@clerk/nextjs";
import { Search, Bell } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

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

        {HAS_CLERK ? (
          <UserButton
            appearance={{
              elements: { avatarBox: "h-8 w-8 border border-[var(--line-strong)]" },
            }}
          />
        ) : (
          <div
            className="h-8 w-8 border border-[var(--line-strong)] bg-[var(--bg-2)] grid place-items-center t-mono-xs text-[var(--fg-mute)]"
            title="Clerk not configured"
            aria-label="User account placeholder — Clerk not configured"
          >
            OP
          </div>
        )}
      </div>
    </header>
  );
}
