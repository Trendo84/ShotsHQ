"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  TEMPLATES,
  TEMPLATE_COUNT,
  type Template,
} from "@/lib/templates/catalog";
import { templateHref } from "@/lib/templates/redirect";

/**
 * Templates gallery. Each tile is a hand-tuned "screenshot inside a
 * device frame" composition — the actual visual artifact ShotsHQ
 * produces, not a mockup of one. Tile order alternates aspect/density
 * so the grid reads as a portfolio, not a uniform list.
 *
 * Full view supports a Free / Pro filter and a bottom CTA. The compact
 * (homepage) view skips the filter and uses a "Browse all" CTA.
 *
 * Routing: see `lib/templates/redirect.ts` and the audit finding
 * `docs/audits/2026-04-30-comet-sonnet-editor.md` #1. Logged-in users
 * route directly to `/projects/new?template=<slug>`; anonymous users
 * route through `/sign-up?redirect_url=...` which honors the seeded
 * wizard path post-signup.
 */

type Filter = "all" | "free" | "pro";


export function Templates({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (compact || filter === "all") return TEMPLATES;
    return TEMPLATES.filter((t) =>
      filter === "free" ? t.tag === "Free" : t.tag === "Pro",
    );
  }, [compact, filter]);

  const list = compact ? filtered.slice(0, 6) : filtered;
  const freeCount = TEMPLATES.filter((t) => t.tag === "Free").length;
  const proCount  = TEMPLATES.filter((t) => t.tag === "Pro").length;

  return (
    <section className="border-b border-[var(--line)] bg-[var(--bg)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">
        <div className="grid grid-cols-12 gap-8 mb-10 items-end">
          <h2 className="col-span-12 md:col-span-7 t-display t-h-3">
            Start from a direction,
            <br />
            <span className="text-[var(--accent)]">not a blank canvas.</span>
          </h2>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md">
            {TEMPLATE_COUNT}&nbsp;starting points for App Store launches. Pick one, swap your screens in, refine.
          </p>
        </div>

        {/* Filter tabs — only on the full /templates page */}
        {!compact && (
          <div className="flex items-center gap-1 mb-8 flex-wrap">
            <FilterTab active={filter === "all"}  onClick={() => setFilter("all")}  label="All"   count={TEMPLATES.length} />
            <FilterTab active={filter === "free"} onClick={() => setFilter("free")} label="Free"  count={freeCount} />
            <FilterTab active={filter === "pro"}  onClick={() => setFilter("pro")}  label="Pro"   count={proCount} />
            <span className="ml-auto t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.16em] hidden sm:inline">
              Showing {list.length} of {TEMPLATE_COUNT}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {list.map((t, i) => (
            <TemplateCard key={t.slug} t={t} dense={i % 5 === 2} />
          ))}
        </div>

        {/* Compact (homepage) → "Browse all templates" link to /templates */}
        {compact && (
          <div className="mt-12 flex justify-center">
            <Link
              href="/templates"
              className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-6 pr-1.5 py-2 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            >
              <span className="btn-label">Browse all templates</span>
              <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 leading-none font-bold">
                <span aria-hidden className="-mt-px">→</span>
              </span>
            </Link>
          </div>
        )}

        {/* Full /templates page → conversion CTA at the bottom */}
        {!compact && (
          <div className="mt-16 lg:mt-20 border border-[var(--line-strong)] bg-[var(--bg-2)] p-8 lg:p-12 grid grid-cols-12 gap-6 items-center">
            <div className="col-span-12 md:col-span-7">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Pick one. Customize anything.</div>
              <h3 className="t-display text-[clamp(1.75rem,4vw,3rem)] leading-[0.95] text-balance">
                Templates are <span className="text-[var(--accent)]">starting points</span> —
                you decide where they go.
              </h3>
              <p className="t-prose mt-4 max-w-lg">
                Every template is fully editable in the canvas. Swap copy,
                palette, device frame, layout — or generate a fresh
                composition from your brand URL.
              </p>
            </div>
            <div className="col-span-12 md:col-span-5 flex flex-col sm:flex-row md:flex-col gap-3 md:items-end">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-6 pr-1.5 py-2 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
              >
                <span className="btn-label">Start free</span>
                <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 leading-none font-bold">
                  <span aria-hidden className="-mt-px">→</span>
                </span>
              </Link>
              <Link
                href="/pricing"
                className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)] transition-colors px-2 py-2"
              >
                See pricing
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterTab({
  active, onClick, label, count,
}: {
  active:  boolean;
  onClick: () => void;
  label:   string;
  count:   number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 px-3.5 py-2 t-mono-xs uppercase tracking-[0.14em] border transition-colors ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]"
          : "border-[var(--line-strong)] text-[var(--fg-mute)] hover:text-[var(--fg)] hover:border-[var(--accent)]"
      }`}
    >
      <span>{label}</span>
      <span className={active ? "text-[var(--accent-fg)] opacity-75" : "text-[var(--fg-mute)]"}>
        {count}
      </span>
    </button>
  );
}

function TemplateCard({ t, dense: _dense = false }: { t: Template; dense?: boolean }) {
  // Belt-and-suspenders cursor + interaction affordance:
  // Inline `cursor: pointer` defeats any Tailwind purge edge case, browser
  // default `<a>` style under SSR-before-hydration, or parent CSS reset
  // that could neutralize `cursor-pointer`. Verified shipping in
  // production traffic where the cards were reading as inert.
  //
  // Auth-aware href: signed-in users go straight to the wizard with the
  // template seeded; anonymous go through /sign-up?redirect_url=... so
  // post-signup they land on the same seeded wizard URL. The pure-logic
  // builder is in lib/templates/redirect.ts (tested separately).
  // Clerk's useUser() resolves async — `isLoaded === false` defaults to
  // the anonymous href, which avoids a hydration flash for the common
  // unauthenticated case on a marketing route.
  const { isLoaded, isSignedIn } = useUser();
  const href = templateHref({
    slug: t.slug,
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
  });

  return (
    <Link
      href={href}
      aria-label={`Use the ${t.name} template`}
      style={{ cursor: "pointer" }}
      className="group relative border border-[var(--line)] bg-[var(--bg)] hover:border-[var(--accent)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--accent)] transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col cursor-pointer focus-visible:outline-none focus-visible:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:-translate-y-0.5"
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-[var(--bg-2)]">
        <Image
          src={`/templates/preview/template-preview-${t.slug}.png`}
          alt={`${t.name} App Store screenshot preview`}
          fill
          sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.025]"
        />
      </div>
      <div className="p-4 flex items-start justify-between gap-3 border-t border-[var(--line)]">
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-[var(--fg)] truncate group-hover:text-[var(--accent)] transition-colors">
            {t.name}
          </div>
          <div className="text-[12px] text-[var(--fg-mute)] truncate">{t.category}</div>
        </div>
        <span
          className={`t-eyebrow normal-case tracking-[0.05em] px-1.5 py-0.5 border ${
            t.tag === "Pro"
              ? "text-[var(--accent)] border-[var(--accent)]"
              : "text-[var(--fg-mute)] border-[var(--line-strong)]"
          }`}
        >
          {t.tag}
        </span>
      </div>

      {/* Idle "Use →" pill — always visible at idle so the card reads as
          interactive even on touch devices and pre-hover. Becomes a
          stronger filled accent on hover/focus. */}
      <span
        aria-hidden
        className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 border border-[var(--line-strong)] bg-[var(--bg)]/85 backdrop-blur-[2px] t-mono-xs uppercase tracking-[0.14em] text-[var(--fg-dim)] group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-fg)] group-hover:border-[var(--accent)] group-focus-visible:bg-[var(--accent)] group-focus-visible:text-[var(--accent-fg)] group-focus-visible:border-[var(--accent)] transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] pointer-events-none"
      >
        Use
        <span className="font-bold">→</span>
      </span>

      {/* Tinted hover overlay — clear interaction affordance */}
      <span
        aria-hidden
        className="absolute inset-0 bg-[var(--accent)]/0 group-hover:bg-[var(--accent)]/[0.06] group-focus-visible:bg-[var(--accent)]/[0.06] transition-colors duration-200 pointer-events-none"
      />
    </Link>
  );
}
