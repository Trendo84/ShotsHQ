"use client";

import { AppCta } from "@/components/marketing/AppCta";

/**
 * Hero CTA cluster — primary + secondary, both auth-aware via the
 * shared `<AppCta>` resolver (post-ship cycle).
 *
 * Signed-out: Start free → /sign-up · See sample output → /templates
 * Signed-in:  Open dashboard → /dashboard · Start a new project → /projects/new
 */
export function HeroCta() {
  return (
    <div className="flex flex-wrap items-center gap-4" data-hero-cta>
      <AppCta
        dataCtaTag="hero-primary"
        signedOut={{ href: "/sign-up",       label: "Start free"        }}
        signedIn={{  href: "/dashboard",     label: "Open dashboard"    }}
      />
      <AppCta
        variant="secondary"
        dataCtaTag="hero-secondary"
        signedOut={{ href: "/templates",     label: "See sample output" }}
        signedIn={{  href: "/projects/new",  label: "Start a new project" }}
      />
    </div>
  );
}
