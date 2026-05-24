"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Shared auth-aware marketing CTA.
 *
 * The brief (post-ship audit) called out that the recovery cycle fixed
 * the Header + Hero CTAs but left the rest of marketing — Surfaces,
 * the landing CTA, Templates' bottom CTA, the sticky bar, and the
 * pricing buttons — still pushing signed-in users back into anonymous
 * `/sign-up` flows. This component is the single source of truth so
 * every marketing primary CTA gates consistently:
 *
 *   - Signed out: the `signedOut` payload (href + label). Defaults to
 *     `Start free → /sign-up` so the bare `<AppCta />` is a usable
 *     drop-in.
 *   - Signed in:  the `signedIn` payload. Defaults to
 *     `Open dashboard → /dashboard`. Any caller that needs a
 *     different in-app destination (e.g. pricing's "Upgrade in
 *     billing" or templates' "Start a new project") overrides via
 *     the `signedIn` prop.
 *
 * Two visual styles:
 *   - `primary` (default): filled accent pill, big enough to anchor a
 *     hero or section CTA.
 *   - `secondary`: a quieter inline link with an arrow.
 *
 * Two sizes:
 *   - `md` (default): hero-scale.
 *   - `sm`: nav-scale (matches the Header's existing inline CTA).
 *
 * If Clerk isn't configured at all (local dev without keys) the
 * `signedOut` branch is rendered unconditionally — keeps marketing
 * functional offline.
 */

type CtaPayload = {
  href:  string;
  label: string;
};

const DEFAULT_SIGNED_OUT: CtaPayload = { href: "/sign-up",  label: "Start free"     };
const DEFAULT_SIGNED_IN:  CtaPayload = { href: "/dashboard", label: "Open dashboard" };

export function AppCta({
  signedOut = DEFAULT_SIGNED_OUT,
  signedIn  = DEFAULT_SIGNED_IN,
  variant   = "primary",
  size      = "md",
  className = "",
  dataCtaTag,
}: {
  signedOut?:  CtaPayload;
  signedIn?:   CtaPayload;
  variant?:    "primary" | "secondary";
  size?:       "md" | "sm";
  className?:  string;
  /** Optional analytics-friendly identifier — sets `data-app-cta`. */
  dataCtaTag?: string;
}) {
  if (!HAS_CLERK) {
    return <CtaButton payload={signedOut} variant={variant} size={size} className={className} dataCtaTag={dataCtaTag} state="signed-out" />;
  }
  return (
    <>
      <SignedOut>
        <CtaButton payload={signedOut} variant={variant} size={size} className={className} dataCtaTag={dataCtaTag} state="signed-out" />
      </SignedOut>
      <SignedIn>
        <CtaButton payload={signedIn} variant={variant} size={size} className={className} dataCtaTag={dataCtaTag} state="signed-in" />
      </SignedIn>
    </>
  );
}

function CtaButton({
  payload,
  variant,
  size,
  className,
  dataCtaTag,
  state,
}: {
  payload:    CtaPayload;
  variant:    "primary" | "secondary";
  size:       "md" | "sm";
  className:  string;
  dataCtaTag?: string;
  state:      "signed-in" | "signed-out";
}) {
  if (variant === "secondary") {
    return (
      <Link
        href={payload.href}
        data-app-cta={dataCtaTag}
        data-app-cta-state={state}
        className={`inline-flex items-center gap-2 text-[14px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors px-2 py-2 ${className}`}
      >
        {payload.label}
        <ArrowRight size={14} aria-hidden />
      </Link>
    );
  }

  const sizing =
    size === "sm"
      ? "text-[13px] px-3.5 py-1.5 rounded-md"
      : "text-[15px] px-5 py-3 rounded-md";

  return (
    <Link
      href={payload.href}
      data-app-cta={dataCtaTag}
      data-app-cta-state={state}
      className={`inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-fg)] font-semibold hover:opacity-90 transition-opacity ${sizing} ${className}`}
    >
      {payload.label}
      <ArrowRight size={size === "sm" ? 13 : 16} strokeWidth={2.5} aria-hidden />
    </Link>
  );
}
