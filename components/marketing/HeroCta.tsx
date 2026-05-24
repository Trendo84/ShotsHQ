"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Auth-aware hero CTA island. Renders inside the server-rendered
 * `<Hero>` so the rest of the hero stays static. The Clerk
 * `<SignedIn>` / `<SignedOut>` components handle the hydration-safe
 * swap server-rendered → client.
 *
 * Signed-out: "Start free" → /sign-up
 * Signed-in:  "Open dashboard" → /dashboard
 *
 * Secondary "See sample output" link is identical in both states.
 */
export function HeroCta() {
  // No Clerk configured (local dev without keys) — render the
  // signed-out treatment unconditionally so the page still functions.
  if (!HAS_CLERK) {
    return <SignedOutCta />;
  }
  return (
    <>
      <SignedOut>
        <SignedOutCta />
      </SignedOut>
      <SignedIn>
        <SignedInCta />
      </SignedIn>
    </>
  );
}

function SignedOutCta() {
  return (
    <div className="flex flex-wrap items-center gap-4" data-hero-cta-state="signed-out">
      <Link
        href="/sign-up"
        className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-fg)] font-semibold text-[15px] px-5 py-3 rounded-md hover:opacity-90 transition-opacity"
      >
        Start free
        <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
      </Link>
      <Link
        href="/templates"
        className="inline-flex items-center gap-2 text-[14px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors px-2 py-2"
      >
        See sample output
        <ArrowRight size={14} aria-hidden />
      </Link>
    </div>
  );
}

function SignedInCta() {
  return (
    <div className="flex flex-wrap items-center gap-4" data-hero-cta-state="signed-in">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-fg)] font-semibold text-[15px] px-5 py-3 rounded-md hover:opacity-90 transition-opacity"
      >
        Open dashboard
        <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
      </Link>
      <Link
        href="/projects/new"
        className="inline-flex items-center gap-2 text-[14px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors px-2 py-2"
      >
        Start a new project
        <ArrowRight size={14} aria-hidden />
      </Link>
    </div>
  );
}
