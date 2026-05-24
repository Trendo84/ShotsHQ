import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/clerk";
import { listProjectsForUser } from "@/lib/db/queries/projects";
import {
  projectStatus,
  projectStatusDisplay,
  nextActionFor,
} from "@/lib/studio/project-status";

/**
 * /projects — work library.
 *
 * Recovery-cycle redesign (2026-05-24):
 *   - removed the ops-board framing ("PROJECT INDEX" / "ALL SLOTS UNDER
 *     CAPACITY" / "Operator · Projects" eyebrow)
 *   - dropped the 8-char raw UUID prefix that was leading every card —
 *     project name is the only identifier the user should scan for
 *   - cards now carry a state-aware next action (Upload / Open studio /
 *     Open exports) so each card answers "what should I do next?"
 *   - desktop layout drops from a 3-up grid that left huge dead zones
 *     for 1-4 projects to a denser 2-up list pattern that scales
 *     gracefully — composed at any count
 */
export default async function ProjectsPage() {
  const user     = await requireUser();
  const projects = await listProjectsForUser(user.id);

  return (
    <>
      <Topbar section="Projects" breadcrumb={["Projects"]} />

      <div className="px-4 sm:px-6 lg:px-8 py-8 lg:py-10 max-w-[1480px]">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 lg:mb-10">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-2">
              Your work
            </div>
            <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.02em] text-[var(--fg)] leading-tight">
              {projects.length === 0
                ? "Start your first project."
                : projects.length === 1
                  ? "1 project"
                  : `${projects.length} projects`}
            </h1>
            {projects.length > 0 && (
              <p className="text-[14px] text-[var(--fg-dim)] mt-2 max-w-md">
                Each project is one App Store launch. Continue work, or
                commission a new one.
              </p>
            )}
          </div>
          {projects.length > 0 && (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-fg)] font-semibold text-[14px] px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity"
            >
              <Plus size={14} strokeWidth={2.5} aria-hidden />
              New project
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <EmptyProjects />
        ) : (
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            {projects.map((p) => {
              const info       = projectStatus(p.polotnoJson);
              const display    = projectStatusDisplay(info, p.id);
              const nextAction = nextActionFor(p.id, info.status);
              return (
                <li key={p.id}>
                  <ProjectCard
                    projectId={p.id}
                    name={p.name}
                    category={p.category}
                    updatedAt={p.updatedAt}
                    status={info.status}
                    statusLabel={display.label}
                    statusVariant={display.variant}
                    statusHelp={display.help}
                    readyPanels={info.readiness.readyPanels}
                    totalPanels={info.readiness.totalPanels}
                    nextActionHref={nextAction.href}
                    nextActionLabel={nextAction.label}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function ProjectCard({
  projectId,
  name,
  category,
  updatedAt,
  status,
  statusLabel,
  statusVariant,
  statusHelp,
  readyPanels,
  totalPanels,
  nextActionHref,
  nextActionLabel,
}: {
  projectId:        string;
  name:             string;
  category:         string;
  updatedAt:        Date;
  status:           string;
  statusLabel:      string;
  statusVariant:    "default" | "warn" | "live";
  statusHelp?:      string;
  readyPanels:      number;
  totalPanels:      number;
  nextActionHref:   string;
  nextActionLabel:  string;
}) {
  const summary = totalPanels === 0
    ? (category || "Uncategorized")
    : `${readyPanels} of ${totalPanels} panels ready`;

  return (
    <article
      data-project-card={projectId}
      data-project-status={status}
      data-panels-ready={String(readyPanels)}
      data-panels-total={String(totalPanels)}
      className="group surface p-5 sm:p-6 flex flex-col gap-4 hover:bg-[var(--bg-3)] transition-colors"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/projects/${projectId}`}
            className="block text-[18px] font-semibold tracking-[-0.015em] text-[var(--fg)] leading-snug truncate hover:text-[var(--accent)] transition-colors"
          >
            {name}
          </Link>
          <p className="text-[12.5px] text-[var(--fg-mute)] mt-1 truncate">
            {summary} · Updated {timeAgo(updatedAt)}
          </p>
        </div>
        <Badge variant={statusVariant} title={statusHelp}>
          {statusLabel}
        </Badge>
      </header>

      <div className="mt-auto pt-3 border-t border-[var(--line)] flex items-center justify-between gap-3">
        <Link
          href={`/projects/${projectId}`}
          className="text-[12.5px] text-[var(--fg-mute)] hover:text-[var(--fg-dim)] transition-colors"
        >
          Overview
        </Link>
        <Link
          href={nextActionHref}
          data-next-action-label={nextActionLabel}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          {nextActionLabel}
          <ArrowRight size={13} strokeWidth={2.5} aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function timeAgo(date: Date): string {
  const diff   = Date.now() - date.getTime();
  const min    = Math.floor(diff / 60_000);
  const hour   = Math.floor(diff / 3_600_000);
  const day    = Math.floor(diff / 86_400_000);
  if (min  < 1)     return "just now";
  if (min  < 60)    return `${min}m ago`;
  if (hour < 24)    return `${hour}h ago`;
  if (day  < 7)     return `${day}d ago`;
  return date.toISOString().slice(0, 10);
}

function EmptyProjects() {
  return (
    <div className="surface px-6 sm:px-10 py-12 sm:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-2">
            Empty deck
          </div>
          <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.02em] text-[var(--fg)] leading-tight mb-3">
            Your first project on the house.
          </h2>
          <p className="text-[14.5px] text-[var(--fg-dim)] leading-relaxed mb-6 max-w-md">
            Drop in iOS screenshots, pick devices, ship. Your first
            project takes about ninety seconds — no card required.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-fg)] font-semibold text-[14px] px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity"
            >
              Start a project
              <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
            </Link>
            <Link
              href="/templates"
              className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--accent)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)] transition-colors"
            >
              … or pick from a template
            </Link>
          </div>
        </div>
        <ol className="space-y-2.5 text-[13.5px] text-[var(--fg-dim)] leading-relaxed border-l border-[var(--line)] pl-5">
          <li><span className="text-[var(--accent)] mr-2 font-medium">01</span> Pick devices · iPhone 6.9″ / 6.7″ / iPad 13″</li>
          <li><span className="text-[var(--accent)] mr-2 font-medium">02</span> Drop raw PNGs · auto-bucketed by dimension</li>
          <li><span className="text-[var(--accent)] mr-2 font-medium">03</span> Compose in Studio · export at App Store-exact dims</li>
        </ol>
      </div>
    </div>
  );
}
