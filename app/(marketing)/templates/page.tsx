import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Templates } from "@/components/marketing/Templates";
import { TemplateFeaturePick } from "@/components/marketing/TemplateFeaturePick";
import { TEMPLATES, TEMPLATE_COUNT } from "@/lib/templates/catalog";

export const metadata: Metadata = {
  title: "Templates",
  description: "Curated starting points for your App Store screenshots — pick one, swap your shots in, ship.",
};

/**
 * Templates — curated library, not a grid page.
 * Structural redesign 2026-05-24.
 *
 * Was: a single hero header followed by the full 21-card grid. The
 * page answered "browse our catalog" — never "which template should
 * I start from?"
 *
 * Now the page leads with a curation moment:
 *
 *   1. Header — a single editorial framing question
 *   2. <TemplateFeaturePick> — three hand-picked starters, each with
 *      explicit "best for…" framing. The buyer picks one IMMEDIATELY,
 *      not after scanning 21 cards.
 *   3. Category index — quick anchor links per app-store category
 *      ("Productivity", "Health & fitness", "Finance", …) so the
 *      buyer who already knows their domain can jump.
 *   4. Full grid — same as before, but framed as the "browse the
 *      rest" library, not the page's primary content.
 *   5. CTA block — uses the shared AppCta inside the existing
 *      <Templates /> component's bottom-CTA path.
 */
export default function TemplatesPage() {
  // Build the unique category list from the catalog so the index
  // stays in sync if new templates ship.
  const categories = Array.from(new Set(TEMPLATES.map((t) => t.category))).sort();

  return (
    <>
      {/* Header — curation framing, not "look at our catalog" */}
      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-3">
            Starting points
          </div>
          <h1 className="text-balance text-[clamp(2rem,5vw,3.75rem)] font-semibold tracking-[-0.04em] leading-[1.04] text-[var(--fg)] max-w-3xl">
            Which one of these does your app look like?
          </h1>
          <p className="text-[16px] leading-[1.6] text-[var(--fg-dim)] mt-5 max-w-[58ch]">
            Every template ships as a complete App Store pack — typography,
            palette, device frame, layout — that you can swap your shots
            into and refine. {TEMPLATE_COUNT} curated starters across
            the App Store categories that actually launch on Apple.
          </p>
        </div>
      </section>

      {/* Curated three-up — the editorial pick */}
      <section className="border-b border-[var(--line)] bg-[var(--bg-2)]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="mb-8">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--fg-mute)] font-medium mb-2">
              The editorial pick · 03 of {TEMPLATE_COUNT}
            </div>
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.025em] text-[var(--fg)] leading-[1.05]">
              Three starters that cover most launches.
            </h2>
          </div>
          <TemplateFeaturePick />
        </div>
      </section>

      {/* Category index — anchor links into the grid */}
      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--fg-mute)] font-medium mb-3">
            Browse by category
          </div>
          <ul className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <li key={cat}>
                <Link
                  href="#full-library"
                  className="inline-flex items-center text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] px-3 py-1.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] transition-colors"
                >
                  {cat}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="#full-library"
                className="inline-flex items-center gap-1.5 text-[13px] text-[var(--accent)] font-medium px-3 py-1.5 rounded-md transition-opacity hover:opacity-80"
              >
                Browse all
                <ArrowRight size={13} strokeWidth={2.5} aria-hidden />
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* Full library — the rest of the catalog, framed as secondary */}
      <div id="full-library">
        <Templates />
      </div>
    </>
  );
}
