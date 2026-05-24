"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { templateHref } from "@/lib/templates/redirect";

/**
 * TemplateFeaturePick — three hand-picked starters with explicit
 * "best for…" framing. Structural redesign 2026-05-24: was a 21-card
 * grid that the buyer had to scan; now it leads with three curated
 * picks so the buyer can act in one scroll.
 *
 * Each card auth-aware: signed-in users go straight to
 * `/projects/new?template=<slug>`; signed-out go through `/sign-up`
 * with the redirect preserved (via templateHref).
 */

type Pick = {
  slug:    string;
  name:    string;
  bestFor: string;
  pitch:   string;
};

const PICKS: Pick[] = [
  {
    slug:    "mono-punch",
    name:    "Mono Punch",
    bestFor: "Productivity · utility · indie",
    pitch:   "Tight monochrome layout. Big bold headlines, no clutter. The default starter for first-time launchers.",
  },
  {
    slug:    "tideline",
    name:    "Tideline",
    bestFor: "Travel · weather · outdoor",
    pitch:   "Cool palette with a wave decoration. Reads as calm and confident — works for any data-rich app.",
  },
  {
    slug:    "editorial-print",
    name:    "Editorial Print",
    bestFor: "News · reading · long-form",
    pitch:   "Italic serif disruptor on a warm cream background. Premium publishing energy without going twee.",
  },
];

export function TemplateFeaturePick() {
  const { isLoaded, isSignedIn } = useUser();
  return (
    <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
      {PICKS.map((p, i) => {
        const href = templateHref({
          slug:       p.slug,
          isLoaded,
          isSignedIn: Boolean(isSignedIn),
        });
        return (
          <li key={p.slug}>
            <Link
              href={href}
              data-template-feature-slug={p.slug}
              className="group flex flex-col overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--bg)] hover:border-[var(--accent)] hover:-translate-y-1 transition-all duration-200"
            >
              <div className="relative bg-[var(--bg-2)]" style={{ aspectRatio: "3 / 4" }}>
                <Image
                  src={`/templates/preview/template-preview-${p.slug}.png`}
                  alt={`${p.name} App Store screenshot preview`}
                  width={600}
                  height={800}
                  sizes="(max-width: 767px) 100vw, 33vw"
                  priority={i === 0}
                  loading={i === 0 ? "eager" : "lazy"}
                  quality={88}
                  unoptimized
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-black/30 to-transparent pointer-events-none"
                />
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/30 bg-black/55 backdrop-blur-[2px] text-[10.5px] uppercase tracking-[0.14em] font-medium text-white group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-fg)] group-hover:border-[var(--accent)] transition-all">
                  Use this <ArrowRight size={11} strokeWidth={2.5} aria-hidden />
                </span>
              </div>
              <div className="p-5 flex flex-col gap-2">
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium">
                  Best for · {p.bestFor}
                </div>
                <h3 className="text-[18px] font-semibold tracking-[-0.015em] text-[var(--fg)] leading-snug">
                  {p.name}
                </h3>
                <p className="text-[13.5px] leading-[1.55] text-[var(--fg-dim)]">
                  {p.pitch}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
