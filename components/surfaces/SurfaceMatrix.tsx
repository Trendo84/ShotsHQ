"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  SURFACES,
  SURFACE_CATEGORIES,
  type Surface,
  type SurfaceCategory,
  type SurfacePlan,
  planAllows,
} from "@/lib/surfaces/catalog";

/**
 * Configurable surface matrix — used on /projects/[id]/surfaces.
 * Multi-select picker with category tabs, plan-gated CTAs, and a
 * sticky footer summary.
 *
 * Persistence + render dispatch will be wired in a follow-up. For now
 * we keep selection state in component memory and the "Render all"
 * CTA is honestly disabled with explanatory copy — selecting a
 * surface is still useful (informs the user what we'll render and at
 * what dimensions) but clicking the dispatch button is not a no-op
 * pretending to be live. Audit P1-7.
 */
export function SurfaceMatrix({ projectId }: { projectId: string }) {
  const [selected, setSelected] = useState<string[]>(["ios-appstore"]);
  const [activeCategory, setActiveCategory] = useState<SurfaceCategory | "all">("all");

  // In production this comes from the user record. Stub: free during build,
  // the Surface tier-gating still functions and shows the upsell affordance.
  const userPlan: SurfacePlan = "indie";

  const filtered = useMemo(() => {
    if (activeCategory === "all") return SURFACES;
    return SURFACES.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  function toggle(id: string) {
    const surface = SURFACES.find((s) => s.id === id);
    if (!surface) return;
    // ios-appstore is always required.
    if (id === "ios-appstore" && selected.includes(id)) return;
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  }

  const totalVariants = useMemo(() => {
    return selected.reduce((sum, id) => {
      const s = SURFACES.find((x) => x.id === id);
      return sum + (s?.variants.length ?? 0);
    }, 0);
  }, [selected]);

  return (
    <div className="pb-32">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-8">
        {/* Category tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8 pb-4 border-b border-[var(--line)] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={tabClass(activeCategory === "all")}
          >
            All
          </button>
          {SURFACE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.id)}
              className={tabClass(activeCategory === c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)]">
          {filtered.map((s) => (
            <SurfaceCard
              key={s.id}
              surface={s}
              selected={selected.includes(s.id)}
              onToggle={() => toggle(s.id)}
              userPlan={userPlan}
            />
          ))}
        </div>
      </div>

      {/* Sticky summary footer */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--line-strong)] bg-[var(--bg)]/95 backdrop-blur-md">
        <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-4 flex flex-wrap items-center gap-4">
          <div>
            <div className="t-mono-xs text-[var(--fg-mute)]">Render manifest</div>
            <div className="t-display text-[20px] leading-[0.95] mt-0.5 normal-case">
              {selected.length} surface{selected.length === 1 ? "" : "s"} ·{" "}
              <span className="text-[var(--accent)]">{totalVariants}</span> variant{totalVariants === 1 ? "" : "s"}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href={`/projects/${projectId}/exports`}
              className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)] px-2 py-2"
            >
              View existing exports
            </Link>
            {/*
              "Render all" dispatch is not yet wired to the Trigger.dev
              task. Audit P1-7 found this button looked active but
              produced no observable result. Until the dispatch route
              ships, the button is honestly disabled + labelled so users
              understand selecting surfaces sets up the manifest but
              doesn't fire a render. The disabled visual is the brand
              "soon" pattern: opacity-50 + cursor-not-allowed + a clear
              "· Soon" suffix in the label.
            */}
            <button
              type="button"
              disabled
              aria-disabled
              title="Render dispatch is in active development — selecting surfaces here saves the manifest only. The render queue ships in v1.1."
              className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-5 pr-1.5 py-2 opacity-50 cursor-not-allowed"
            >
              <span className="btn-label">Render all <span className="text-[var(--accent-fg)]/70 ml-1">· Soon</span></span>
              <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] font-bold">
                →
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SurfaceCard({
  surface,
  selected,
  onToggle,
  userPlan,
}: {
  surface: Surface;
  selected: boolean;
  onToggle: () => void;
  userPlan: SurfacePlan;
}) {
  const allowed = planAllows(userPlan, surface.minPlan);
  const isAlwaysOn = surface.id === "ios-appstore";

  return (
    <article className="bg-[var(--bg)] p-5 md:p-6 flex flex-col gap-4 min-h-[320px] relative">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusPill status={surface.status} />
            {surface.minPlan !== "free" && (
              <span className="t-mono-xs uppercase tracking-[0.14em] font-semibold text-[var(--fg-mute)]">
                {surface.minPlan === "indie" ? "Indie+" : "Studio"}
              </span>
            )}
          </div>
          <h3 className="t-display text-[clamp(1.25rem,3vw,1.5rem)] leading-[0.95] tracking-[-0.02em]">
            {surface.name}
          </h3>
          <p className="t-mono-xs text-[var(--fg-dim)] mt-1">{surface.tagline}</p>
        </div>
      </header>

      {/* Aspect-correct preview tile */}
      <div
        className="relative w-full bg-[var(--bg-2)] border border-[var(--line)] overflow-hidden"
        style={{ aspectRatio: surface.previewAspect }}
      >
        <PreviewTile category={surface.category} />
      </div>

      <p className="t-prose text-[13px] leading-snug">{surface.rationale}</p>

      {/* Variants */}
      <ul className="border-t border-[var(--line)] pt-3 space-y-1">
        {surface.variants.map((v) => (
          <li key={v.id} className="flex items-center justify-between text-[12px]">
            <span className="text-[var(--fg)] truncate">{v.name}</span>
            <span className="t-mono-xs text-[var(--fg-dim)] tabular-nums shrink-0 ml-2">
              {v.width === 0 ? "ZIP" : `${v.width}×${v.height}`}
              {v.required && (
                <span className="ml-2 text-[var(--accent)] font-semibold uppercase tracking-[0.14em]">Req</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-auto pt-3 border-t border-[var(--line)] flex items-center gap-3">
        {allowed ? (
          <button
            type="button"
            onClick={onToggle}
            disabled={isAlwaysOn && selected}
            aria-pressed={selected}
            className={`flex-1 py-2.5 px-3 t-mono-xs uppercase tracking-[0.14em] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
              selected
                ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                : "border border-[var(--line-strong)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            } ${isAlwaysOn && selected ? "opacity-90 cursor-default" : ""}`}
          >
            {selected ? (isAlwaysOn ? "Always rendered" : "✓ Selected") : "+ Add to render"}
          </button>
        ) : (
          <Link
            href="/billing"
            className="flex-1 py-2.5 px-3 t-mono-xs uppercase tracking-[0.14em] font-semibold border border-[var(--line)] text-center text-[var(--fg-dim)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            Upgrade to {surface.minPlan === "indie" ? "Indie" : "Studio"} →
          </Link>
        )}
      </div>
    </article>
  );
}

function tabClass(active: boolean) {
  return `px-3 py-1.5 t-mono-xs uppercase tracking-[0.14em] transition-colors border ${
    active
      ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]"
      : "border-[var(--line)] text-[var(--fg-dim)] hover:text-[var(--fg)] hover:border-[var(--line-strong)]"
  }`;
}

function StatusPill({ status }: { status: Surface["status"] }) {
  const map = {
    live: { label: "Live", color: "var(--signal)", border: "var(--signal)" },
    beta: { label: "Beta", color: "var(--accent)", border: "var(--accent)" },
    soon: { label: "Soon", color: "var(--fg-mute)", border: "var(--line-strong)" },
  } as const;
  const c = map[status];
  return (
    <span
      className="t-mono-xs uppercase tracking-[0.14em] font-semibold px-1.5 py-0.5 inline-flex items-center gap-1.5"
      style={{ color: c.color, border: `1px solid ${c.border}` }}
    >
      <span className="block w-1 h-1" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}

/* Aspect-correct preview tiles — micro-renders of each surface layout. */

function PreviewTile({ category }: { category: SurfaceCategory }) {
  if (category === "appstore") {
    return (
      <div className="absolute inset-0 grid grid-cols-3 gap-1 p-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-[var(--bg)] border border-[var(--line)] flex flex-col p-1.5 gap-1">
            <div className="h-1.5 w-3/4 bg-[var(--accent)]" />
            <div className="h-1 w-1/2 bg-[var(--fg-mute)]" />
            <div className="flex-1 mt-1 bg-[var(--bg-2)] border border-[var(--line)]" />
          </div>
        ))}
      </div>
    );
  }
  if (category === "web") {
    return (
      <div className="absolute inset-0 flex">
        <div className="flex-1 flex flex-col justify-center gap-1.5 p-3">
          <div className="h-2 w-3/4 bg-[var(--fg)]" />
          <div className="h-2 w-2/3 bg-[var(--accent)]" />
          <div className="h-1 w-1/2 bg-[var(--fg-mute)] mt-1" />
          <div className="h-3 w-16 bg-[var(--accent)] mt-2" />
        </div>
        <div className="w-1/3 flex items-center justify-center p-3">
          <div className="w-10 h-20 bg-[var(--bg)] border border-[var(--line-strong)]" />
        </div>
      </div>
    );
  }
  if (category === "social") {
    return (
      <div className="absolute inset-0 flex flex-col p-3 gap-1.5">
        <div className="t-mono-xs text-[var(--fg-mute)] tracking-[0.16em]">SHOTSHQ.COM</div>
        <div className="h-2 w-4/5 bg-[var(--fg)] mt-auto" />
        <div className="h-2 w-3/5 bg-[var(--accent)]" />
        <div className="flex items-center gap-1.5 mt-1">
          <span className="block w-3 h-3 bg-[var(--accent)]" />
          <span className="h-1 w-1/3 bg-[var(--fg-mute)]" />
        </div>
      </div>
    );
  }
  if (category === "community") {
    return (
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-px p-1.5 bg-[var(--line)]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--bg)]"
            style={{ background: i === 0 ? "var(--accent)" : "var(--bg)" }}
          />
        ))}
      </div>
    );
  }
  // press
  return (
    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px p-1.5 bg-[var(--line)]">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-center"
          style={{
            background: i === 4 ? "var(--accent)" : "var(--bg)",
            outline: i === 8 ? "1px dashed var(--accent)" : "none",
            outlineOffset: "-2px",
          }}
        >
          {i === 8 ? (
            <span className="t-mono-xs text-[var(--accent)] tracking-[0.12em]">ZIP</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
