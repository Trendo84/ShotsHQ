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

  const ACTIONS = [
    { href: `/projects/${id}/studio`,   icon: Smartphone, label: "Open studio", desc: "Constrained screenshot engine", code: "01" },
    { href: `/projects/${id}/ai`,       icon: Sparkles,   label: "AI panel",    desc: "Copy, backdrop, restyle",        code: "02" },
    { href: `/projects/${id}/surfaces`, icon: Layers,     label: "Surfaces",    desc: "App Store + web + social",       code: "03" },
    { href: `/projects/${id}/exports`,  icon: Download,   label: "Exports",     desc: "Render and download",            code: "04" },
    { href: `/projects/${id}/ai#i18n`,  icon: Globe,      label: "Translate",   desc: "41-locale fan-out",              code: "05" },
  ];

  return (
    <>
      <Topbar section="Project" breadcrumb={["Operator", "Projects", project.name]} />

      <div className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-7 border-r-0 md:border-r border-[var(--line)] p-5 sm:p-6 md:p-10">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="t-mono-xs text-[var(--fg-mute)]">[ {project.id.slice(0, 8)} ]</span>
            <Badge variant={display.variant} data-project-status={status}>
              {display.label}
            </Badge>
          </div>
          <h1 className="t-display text-[clamp(2rem,6vw,5.5rem)] leading-[0.92] normal-case tracking-[-0.04em] break-words text-balance">
            {project.name}.
          </h1>
          {project.appDescription && (
            <p className="t-mono-md text-[var(--fg-dim)] mt-4 max-w-xl">{project.appDescription}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {/* State-aware primary CTA. Audit cycle #4: the page used
               to show "Open studio" regardless of state; for a ready
               project that's not the operator's next useful action. */}
            <Link
              href={nextAction.href}
              data-next-action={nextAction.id}
              className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-5 pr-1.5 py-2 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              <NextActionIcon id={nextAction.id} />
              <span className="btn-label">{nextAction.label}</span>
              <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform group-hover:translate-x-0.5 font-bold">→</span>
            </Link>
            <Link href={`/projects/${id}/studio`} className="btn text-[12px] tracking-[0.04em] normal-case">Studio</Link>
            <Link href={`/projects/${id}/ai`} className="btn text-[12px] tracking-[0.04em] normal-case">AI panel</Link>
            <Link href={`/projects/${id}/exports`} className="btn text-[12px] tracking-[0.04em] normal-case">Exports</Link>
          </div>
          <p className="t-mono-xs text-[var(--fg-mute)] mt-4 max-w-xl leading-relaxed" data-next-action-help={nextAction.id}>
            {nextAction.help}
          </p>
        </div>
        <aside className="col-span-12 md:col-span-5 p-5 sm:p-6 md:p-10 grid grid-cols-2 gap-y-4 gap-x-2 content-between border-t md:border-t-0 border-[var(--line)]">
          <Stat label="CATEGORY" value={project.category || "—"} />
          <Stat label="CREATED"  value={created}  numeric />
          <Stat label="UPDATED"  value={updated}  numeric />
          <Stat label="TARGETS"  value={String(targets.length).padStart(2, "0")} numeric />
          <Stat label="PANELS"   value={String(readiness.totalPanels).padStart(2, "0")} numeric />
          <Stat label="READY"    value={`${String(readiness.readyPanels).padStart(2, "0")} / ${String(readiness.totalPanels).padStart(2, "0")}`} numeric />
        </aside>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 grid-rule">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              href={a.href}
              className="p-5 sm:p-6 min-h-[180px] sm:min-h-[200px] flex flex-col justify-between hover:bg-[var(--bg-2)] transition-colors"
            >
              <header className="flex items-start justify-between">
                <Icon size={24} className="text-[var(--accent)]" />
                <span className="t-mono-xs text-[var(--fg-mute)]">{a.code}</span>
              </header>
              <div>
                <div className="t-display text-[clamp(1.25rem,2.4vw,1.625rem)] leading-[0.95] normal-case tracking-[-0.02em]">
                  {a.label}
                </div>
                <div className="text-[12px] text-[var(--fg-mute)] mt-1">{a.desc}</div>
              </div>
              <ArrowRight size={16} className="text-[var(--fg-mute)] self-end" />
            </Link>
          );
        })}
      </section>

      <section className="grid grid-cols-12 border-t-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-8 border-r-0 md:border-r border-[var(--line)]">
          <div className="px-5 sm:px-6 py-3 border-b border-[var(--line)] flex items-center justify-between flex-wrap gap-2">
            <span className="t-eyebrow t-eyebrow-accent">Shot grid</span>
            <span
              className="t-mono-xs text-[var(--fg-mute)]"
              data-shot-grid-ready={String(readiness.readyPanels)}
              data-shot-grid-total={String(readiness.totalPanels)}
            >
              {readiness.totalPanels === 0
                ? "no panels yet"
                : `${readiness.readyPanels} / ${readiness.totalPanels} ready`}
            </span>
          </div>
          {readiness.totalPanels === 0 ? (
            <EmptyShotGrid projectId={id} />
          ) : (
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
          )}
        </div>
        <aside className="col-span-12 md:col-span-4 border-t md:border-t-0 border-[var(--line)]">
          <div className="px-5 sm:px-6 py-3 border-b border-[var(--line)]">
            <span className="t-eyebrow t-eyebrow-accent">Targets</span>
          </div>
          {targets.length === 0 ? (
            <div className="p-5 sm:p-6 t-mono-xs text-[var(--fg-mute)] text-center">
              No device targets selected yet.
              <br />
              <Link href={`/projects/${id}/studio`} className="text-[var(--accent)] underline mt-2 inline-block">
                Open studio →
              </Link>
            </div>
          ) : (
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
          )}
        </aside>
      </section>
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
    case "add-targets-in-studio": return <Smartphone size={14} className="ml-[-2px]" />;
    case "upload-in-studio":      return <Upload     size={14} className="ml-[-2px]" />;
    case "prepare-in-studio":     return <Upload     size={14} className="ml-[-2px]" />;
    case "open-exports":          return <Download   size={14} className="ml-[-2px]" />;
  }
}

function Stat({ label, value, numeric = false }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="border-b border-[var(--line)] pb-3 min-w-0">
      <dt className="t-mono-xs text-[var(--fg-mute)]">{label}</dt>
      <dd className={`t-mono-md text-[var(--fg)] mt-1 truncate ${numeric ? "t-numeric" : ""}`}>{value}</dd>
    </div>
  );
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
