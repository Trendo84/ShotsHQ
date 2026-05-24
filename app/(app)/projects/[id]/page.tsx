import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/app/Topbar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Download,
  Globe,
  Layers,
  Smartphone,
  Sparkles,
  Upload,
} from "lucide-react";
import { requireUser } from "@/lib/auth/clerk";
import { getProject } from "@/lib/db/queries/projects";
import { DEVICES_BY_ID } from "@/lib/devices/catalog";
import { storeTargetForCatalogId } from "@/lib/devices/store-target";
import { deviceById, type StudioDesign, type StudioDesignSet } from "@/components/studio/types";
import {
  nextActionFor,
  projectStatus,
  projectStatusDisplay,
  type NextActionId,
} from "@/lib/studio/project-status";
import { evaluatePanel } from "@/lib/studio/readiness";

/**
 * Project overview.
 *
 * Browser audit (cycle #4, 2026-05-23): this page used to hardcode
 *   - "0 / 24 slots" on the shot-grid header
 *   - 8 fixed `EmptyTile` placeholders regardless of real state
 *   - "◯ READY" on every target row, ignoring whether the project
 *     had any uploaded screenshots or written headlines
 * Independent lie on a third surface, after Studio (cycle #2) and
 * /exports (cycle #2) were already wired to the shared readiness
 * model. Cycle #4 makes the overview tell the same truth.
 *
 * Source of truth (same as Studio + /exports):
 *   - polotnoJson.studio (panels[] with deviceId + screenshotUrl +
 *     screenshotRemote + headline)
 *   - evaluateStudio(set) — per-panel readiness via
 *     lib/studio/readiness.ts
 *   - storeTargetForCatalogId() — catalog id → store-target enum
 *     so we can join `project.storeTargets` (catalog ids) to
 *     `studio.panels[].deviceId` (store-target enums)
 *
 * Output:
 *   - Shot grid: ordered panel tiles with per-panel READY/DRAFT
 *     dot, or an explicit empty state when there are no panels.
 *   - Targets: each row shows status derived from real panels for
 *     that device class — Ready / Partial / Drafting / Targeted —
 *     never plain "READY" unless every targeted panel passes
 *     evaluatePanel.
 *   - Primary CTA: state-aware (Upload in Studio / Prepare in
 *     Studio / Open Exports) so the operator's next useful action
 *     is obvious without clicking around.
 */
export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }   = await params;
  const user     = await requireUser();
  const project  = await getProject(id, user.id);
  if (!project) notFound();

  const targets    = project.storeTargets ?? [];
  const created    = project.createdAt.toISOString().slice(0, 10);
  const updated    = project.updatedAt.toISOString().slice(0, 16).replace("T", " ");
  const projectInfo = projectStatus(project.polotnoJson);
  const { studio, readiness, status } = projectInfo;
  const display    = projectStatusDisplay(projectInfo, id);
  const nextAction = nextActionFor(id, status);

  // Rank modules by readiness: the next-action route gets the lead
  // card; the others follow in their canonical order. This stops the
  // page from presenting five equal-weight tiles.
  const ACTION_DEFS = [
    { id: "studio",   href: `/projects/${id}/studio`,   icon: Smartphone, label: "Open studio", desc: "Build screenshot panels" },
    { id: "ai",       href: `/projects/${id}/ai`,       icon: Sparkles,   label: "AI panel",    desc: "Headlines, backdrops, restyle" },
    { id: "surfaces", href: `/projects/${id}/surfaces`, icon: Layers,     label: "Surfaces",    desc: "App Store + web + social" },
    { id: "exports",  href: `/projects/${id}/exports`,  icon: Download,   label: "Exports",     desc: "Render and download packs" },
    { id: "i18n",     href: `/projects/${id}/ai#i18n`,  icon: Globe,      label: "Translate",   desc: "41-locale parallel fan-out" },
  ];
  const leadActionId = matchActionId(nextAction.href);
  const lead   = ACTION_DEFS.find((a) => a.id === leadActionId) ?? ACTION_DEFS[0]!;
  const rest   = ACTION_DEFS.filter((a) => a.id !== lead.id);

  return (
    <>
      <Topbar section={project.name} breadcrumb={["Projects", project.name]} />

      {/* Project header — recovery-cycle calmer treatment. Title
         dropped from clamp(2rem, 6vw, 5.5rem) → clamp(1.5rem, 3vw, 2.25rem).
         Raw 8-char UUID prefix gone. Status pill stays. Stats moved
         from a 2×3 right-column slab to a single inline summary
         row beneath the title. */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 lg:pt-10 pb-6 border-b border-[var(--line)] max-w-[1480px]">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-2">
              Project
            </div>
            <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-[var(--fg)] leading-tight break-words text-balance">
              {project.name}
            </h1>
            {project.appDescription && (
              <p className="text-[14.5px] text-[var(--fg-dim)] mt-2 max-w-xl leading-relaxed">
                {project.appDescription}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-[var(--fg-mute)]">
              {project.category && <span>{project.category}</span>}
              <span aria-hidden>·</span>
              <span>
                {readiness.totalPanels === 0
                  ? `${targets.length} ${targets.length === 1 ? "target" : "targets"}`
                  : `${readiness.readyPanels} of ${readiness.totalPanels} panels ready`}
              </span>
              <span aria-hidden>·</span>
              <span>Updated {updated}</span>
              <span aria-hidden>·</span>
              <span>Created {created}</span>
            </div>
          </div>
          <Badge variant={display.variant} data-project-status={status}>
            {display.label}
          </Badge>
        </div>
      </div>

      {/* Next-action hero card. The lead module gets premium real
         estate (full-width banner); the rest hang below as a denser
         secondary row. */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1480px]">
        <Link
          href={nextAction.href}
          data-next-action={nextAction.id}
          className="group block surface-raised p-6 sm:p-8 hover:border-[var(--accent)] transition-colors"
        >
          <div className="flex items-start gap-5 sm:gap-6">
            <div className="grid place-items-center w-12 h-12 rounded-md bg-[var(--accent)] text-[var(--accent-fg)] shrink-0">
              <NextActionIcon id={nextAction.id} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-2">
                Next step
              </div>
              <h2 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold tracking-[-0.015em] text-[var(--fg)] leading-tight">
                {nextAction.label}
              </h2>
              <p className="text-[14px] text-[var(--fg-dim)] mt-2 max-w-2xl leading-relaxed" data-next-action-help={nextAction.id}>
                {nextAction.help}
              </p>
            </div>
            <ArrowRight size={20} strokeWidth={2.5} className="text-[var(--fg-mute)] group-hover:text-[var(--accent)] transition-colors shrink-0 mt-1" />
          </div>
        </Link>

        {/* Secondary actions — quieter row of 4 module shortcuts. */}
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {rest.map((a) => {
            const Icon = a.icon;
            return (
              <li key={a.id}>
                <Link
                  href={a.href}
                  className="group surface p-4 flex items-start gap-3 hover:bg-[var(--bg-3)] transition-colors h-full"
                >
                  <Icon size={18} className="text-[var(--fg-mute)] group-hover:text-[var(--accent)] transition-colors shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium text-[var(--fg)] leading-snug">
                      {a.label}
                    </div>
                    <div className="text-[12px] text-[var(--fg-mute)] mt-0.5 leading-snug">
                      {a.desc}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/*
        Shot grid + Targets — when the project is empty (no panels),
        the page now shows a single compact, instructional empty
        state instead of the giant void-grid presentation. The
        readiness data hooks (data-shot-grid-total, data-shot-grid-
        ready, data-shot-grid-empty, data-target-* per row) are
        retained so the cycle-#4 truthfulness contract still holds.
      */}
      {readiness.totalPanels === 0 ? (
        <section className="px-4 sm:px-6 lg:px-8 pb-12 max-w-[1480px]">
          <div
            className="surface p-6 sm:p-8 lg:p-10"
            data-shot-grid-empty="true"
            data-shot-grid-total={String(readiness.totalPanels)}
            data-shot-grid-ready={String(readiness.readyPanels)}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-7 min-w-0">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-2">
                  Empty project · no panels yet
                </div>
                <div
                  className="mb-3 text-[12px] text-[var(--fg-mute)]"
                  data-shot-grid-ready={String(readiness.readyPanels)}
                  data-shot-grid-total={String(readiness.totalPanels)}
                >
                  {readiness.readyPanels} / {readiness.totalPanels} ready
                </div>
                <h2 className="text-[clamp(1.25rem,2.5vw,1.625rem)] font-semibold tracking-[-0.015em] text-[var(--fg)] leading-tight mb-3">
                  Studio is where panels get built.
                </h2>
                <p className="text-[14px] text-[var(--fg-dim)] leading-relaxed mb-5 max-w-xl">
                  Open Studio to add one screenshot panel per device.
                  Drop the raw PNG, write the headline, pick a layout —
                  each panel becomes one tile in the App Store pack.
                </p>
                <Link
                  href={`/projects/${id}/studio`}
                  className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-fg)] font-semibold text-[14px] px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity"
                >
                  <Smartphone size={14} strokeWidth={2.5} aria-hidden />
                  Open Studio
                </Link>
              </div>
              {targets.length > 0 && (
                <div className="md:col-span-5">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--fg-mute)] font-medium mb-2.5">
                    Device targets
                  </div>
                  <ul className="space-y-1.5">
                    {targets.map((targetId) => {
                      const stats = computeTargetStats(targetId, studio);
                      return (
                        <li
                          key={targetId}
                          data-target-id={targetId}
                          data-target-status={stats.status}
                          data-target-ready={String(stats.ready)}
                          data-target-total={String(stats.total)}
                          className="flex items-center justify-between text-[13px] text-[var(--fg-dim)] py-1 border-b border-[var(--line)] last:border-b-0"
                        >
                          <span className="truncate">{stats.label}</span>
                          <span className="text-[var(--fg-mute)] text-[12px] tabular-nums shrink-0 ml-2">
                            {stats.spec}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-12 border-t border-[var(--line)]">
          <div className="col-span-12 md:col-span-8 border-r-0 md:border-r border-[var(--line)]">
            <div className="px-5 sm:px-6 py-3 border-b border-[var(--line)] flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium">Shots</span>
              <span
                className="text-[12px] text-[var(--fg-mute)]"
                data-shot-grid-ready={String(readiness.readyPanels)}
                data-shot-grid-total={String(readiness.totalPanels)}
              >
                {readiness.readyPanels} / {readiness.totalPanels} ready
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-rule">
              {studio.panels.map((panel, idx) => (
                <PanelTile
                  key={panel.panelId}
                  panel={panel}
                  index={idx}
                  ready={readiness.perPanel[idx]?.ready === true}
                />
              ))}
            </div>
          </div>
          <aside className="col-span-12 md:col-span-4 border-t md:border-t-0 border-[var(--line)]">
            <div className="px-5 sm:px-6 py-3 border-b border-[var(--line)]">
              <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium">Targets</span>
            </div>
            <div className="grid grid-cols-1 grid-rule">
              {targets.map((targetId) => {
                const stats = computeTargetStats(targetId, studio);
                return (
                  <TargetRow
                    key={targetId}
                    targetId={targetId}
                    stats={stats}
                  />
                );
              })}
            </div>
          </aside>
        </section>
      )}
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type TargetStats = {
  total:    number;
  ready:    number;
  status:   "untargeted-by-studio" | "drafting" | "partial" | "ready";
  label:    string;
  spec:     string;
};

function computeTargetStats(catalogId: string, studio: StudioDesignSet): TargetStats {
  const storeTarget = storeTargetForCatalogId(catalogId);
  const device      = DEVICES_BY_ID[catalogId];
  const label       = device?.name ?? catalogId;
  const spec        = device?.shortSpec ?? catalogId.toUpperCase().replace(/_/g, " ");

  const panels = studio.panels.filter((p) => p.deviceId === storeTarget);
  const ready  = panels.filter((p) => evaluatePanel(p).ready).length;
  const total  = panels.length;

  // Distinguish "operator added this device class but Studio has no
  // panel for it" (untargeted-by-studio) from "Studio has panel(s)
  // but none ready" (drafting). Both are honest; the first nudges
  // the user to create a panel, the second to add screenshot/headline.
  let status: TargetStats["status"];
  if (total === 0)         status = "untargeted-by-studio";
  else if (ready === 0)    status = "drafting";
  else if (ready < total)  status = "partial";
  else                     status = "ready";

  return { total, ready, status, label, spec };
}

/**
 * Map a next-action id to its lucide icon at the call site. Kept
 * here (not in the shared util) because the helper stays JSX-free,
 * and the icon set is a presentation-layer decision per surface.
 */
function NextActionIcon({ id }: { id: NextActionId }) {
  switch (id) {
    case "add-targets-in-studio": return <Smartphone size={20} />;
    case "upload-in-studio":      return <Upload     size={20} />;
    case "prepare-in-studio":     return <Upload     size={20} />;
    case "open-exports":          return <Download   size={20} />;
  }
}

/**
 * Map the `nextAction.href` back to the matching ACTION_DEFS id so
 * we know which module to demote out of the secondary row.
 */
function matchActionId(href: string): string {
  if (href.endsWith("/exports"))    return "exports";
  if (href.endsWith("/ai"))         return "ai";
  if (href.includes("#i18n"))       return "i18n";
  if (href.endsWith("/surfaces"))   return "surfaces";
  return "studio";
}

function EmptyShotGrid({ projectId }: { projectId: string }) {
  return (
    <div
      className="p-6 sm:p-8 text-center bg-[var(--bg-2)] min-h-[280px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[var(--line)]"
      data-shot-grid-empty="true"
    >
      <div className="t-eyebrow t-eyebrow-accent">No panels yet</div>
      <p className="t-mono-xs text-[var(--fg-mute)] max-w-md">
        Studio is where panels get built. Add one or more screenshot
        panels there — each becomes a tile in this grid.
      </p>
      <Link
        href={`/projects/${projectId}/studio`}
        className="btn btn-accent inline-flex items-center gap-2 mt-2"
      >
        <Smartphone size={12} /> Open Studio
      </Link>
    </div>
  );
}

function PanelTile({
  panel,
  index,
  ready,
}: {
  panel: StudioDesign;
  index: number;
  ready: boolean;
}) {
  const device = deviceById(panel.deviceId);
  const hasRemote = panel.screenshotRemote === true && Boolean(panel.screenshotUrl);
  return (
    <div
      className={`aspect-[9/19.5] flex items-center justify-center border-2 ${
        ready
          ? "border-[var(--signal,#7CB342)]/40"
          : "border-dashed border-[var(--line)]"
      } bg-[var(--bg-2)] relative overflow-hidden`}
      data-panel-id={panel.panelId}
      data-panel-ready={ready ? "true" : "false"}
      data-panel-device={panel.deviceId}
    >
      {hasRemote ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={panel.screenshotUrl!}
          alt={`Panel ${String(index + 1).padStart(2, "0")} screenshot`}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          crossOrigin="anonymous"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 text-center p-2">
          <span className="t-mono-xs text-[var(--fg-mute)]">{String(index + 1).padStart(2, "0")}</span>
          <span className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.12em]">
            {device.shortLabel}
          </span>
        </div>
      )}
      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1 t-mono-xs">
        <span className={`px-1.5 py-0.5 ${ready ? "text-[var(--signal,#7CB342)]" : "text-[var(--accent)]"} bg-[var(--bg)]/90`}>
          {ready ? "● READY" : "○ DRAFT"}
        </span>
        <span className="t-mono-xs text-[var(--fg-mute)] bg-[var(--bg)]/90 px-1.5 py-0.5">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

function TargetRow({
  targetId,
  stats,
}: {
  targetId: string;
  stats: TargetStats;
}) {
  return (
    <div
      className="p-3 t-mono-xs flex items-center justify-between gap-3"
      data-target-id={targetId}
      data-target-status={stats.status}
      data-target-ready={String(stats.ready)}
      data-target-total={String(stats.total)}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[var(--fg)] truncate">{stats.label}</div>
        <div className="text-[var(--fg-mute)] mt-0.5">
          {stats.spec} ·{" "}
          {stats.status === "untargeted-by-studio"
            ? "no panels yet"
            : `${stats.ready} / ${stats.total} ready`}
        </div>
      </div>
      <TargetStatusPill status={stats.status} />
    </div>
  );
}

function TargetStatusPill({ status }: { status: TargetStats["status"] }) {
  switch (status) {
    case "ready":
      return (
        <span className="inline-flex items-center gap-1.5 text-[var(--signal,#7CB342)]">
          <CheckCircle2 size={12} aria-hidden /> READY
        </span>
      );
    case "partial":
      return (
        <span className="inline-flex items-center gap-1.5 text-[var(--accent)]">
          <Circle size={12} aria-hidden /> PARTIAL
        </span>
      );
    case "drafting":
      return (
        <span className="inline-flex items-center gap-1.5 text-[var(--accent)]">
          <Circle size={12} aria-hidden /> DRAFTING
        </span>
      );
    case "untargeted-by-studio":
      return (
        <span className="inline-flex items-center gap-1.5 text-[var(--fg-mute)]">
          <Circle size={12} aria-hidden /> TARGETED
        </span>
      );
  }
}
