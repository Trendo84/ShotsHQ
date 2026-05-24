"use client";

import * as React from "react";
import { UserButton } from "@clerk/nextjs";

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function UserButtonSlot() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-3)] text-[12px] font-medium text-[var(--fg-mute)]"
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
        className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-3)] text-[12px] font-medium text-[var(--fg-mute)]"
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
          elements: { avatarBox: "h-9 w-9 border border-[var(--line)] shadow-none" },
        }}
      />
    </div>
  );
}

export function Topbar({ section, breadcrumb }: { section: string; breadcrumb?: string[] }) {
  const crumbs = (breadcrumb ?? []).filter((c) => c.toLowerCase() !== "operator");
  const trail = crumbs.length > 1 ? crumbs.slice(0, -1).join(" / ") : "";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          {trail && (
            <div className="mb-1 text-[12px] text-[var(--fg-mute)] truncate">
              {trail}
            </div>
          )}
          <h1 className="truncate text-[18px] font-semibold tracking-[-0.02em] text-[var(--fg)] leading-none">
            {section}
          </h1>
        </div>

        <div className="flex-1" />
        <UserButtonSlot />
      </div>
    </header>
  );
}
