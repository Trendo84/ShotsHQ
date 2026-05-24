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

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await listProjectsForUser(user.id);
  const visibleProjects = projects.slice(0, 60);
  const hiddenCount = Math.max(0, projects.length - visibleProjects.length);

  return (
    <>
      <Topbar section="Projects" />

      <div className="mx-auto w-full max-w-[1380px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 text-[13px] text-[var(--fg-mute)]">Your library</p>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.04em] text-[var(--fg)] leading-[1.02]">
              {projects.length === 0
                ? "Start your first project"
                : projects.length === 1
                  ? "1 project"
                  : `${projects.length} projects`}
            </h1>
            <p className="mt-3 max-w-[52ch] text-[15px] leading-[1.65] text-[var(--fg-dim)]">
              Find a launch, continue editing, or jump straight to exports when a pack is ready.
            </p>
          </div>

          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--accent)] px-4 py-2.5 text-[14px] font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-92"
          >
            <Plus size={15} strokeWidth={2.5} aria-hidden />
            New project
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyProjects />
        ) : (
          <>
            {hiddenCount > 0 && (
              <p className="mb-4 text-[13px] text-[var(--fg-mute)]">
                Showing the most recent {visibleProjects.length} projects. Older launches stay available from the same account history.
              </p>
            )}
            {/*
              Structural redesign 2026-05-24: the page used to render a
              single flat 2/3-up card grid sorted by updatedAt desc.
              Now grouped by lifecycle status so the workspace tells the
              user what's worth resuming first:
                - Ready to ship      (status === "ready")
                - In progress        (status === "partial" | "drafting")
                - Empty               (status === "empty")
              Each group keeps the same card shape so muscle memory still
              works, but the page reads as a curated workspace, not an
              undifferentiated index.
            */}
            {(() => {
              type ProjectWithStatus = {
                p:        typeof projects[number];
                info:     ReturnType<typeof projectStatus>;
                display:  ReturnType<typeof projectStatusDisplay>;
                next:     ReturnType<typeof nextActionFor>;
              };
              const enriched: ProjectWithStatus[] = visibleProjects.map((p) => {
                const info    = projectStatus(p.polotnoJson);
                const display = projectStatusDisplay(info, p.id);
                const next    = nextActionFor(p.id, info.status);
                return { p, info, display, next };
              });
              const ready    = enriched.filter((e) => e.info.status === "ready");
              const inProg   = enriched.filter((e) => e.info.status === "partial" || e.info.status === "blocked");
              const empty    = enriched.filter((e) => e.info.status === "empty");
              const sections = [
                { id: "ready",    title: "Ready to ship",         items: ready,  helper: "Pack is fully composed — open exports to download." },
                { id: "in-prog",  title: "In progress",           items: inProg, helper: "Resume the one you were working on most recently." },
                { id: "empty",    title: "Empty — needs Studio",  items: empty,  helper: "Project exists but no panels yet. Open Studio to start composing." },
              ].filter((s) => s.items.length > 0);

              return (
                <div className="space-y-10">
                  {sections.map((sec) => (
                    <section key={sec.id} data-projects-group={sec.id}>
                      <header className="mb-3 flex items-baseline justify-between gap-3 flex-wrap">
                        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--fg)]">
                          {sec.title}
                          <span className="ml-2 text-[12.5px] font-medium text-[var(--fg-mute)] tabular-nums">
                            {sec.items.length}
                          </span>
                        </h2>
                        <p className="text-[12.5px] text-[var(--fg-mute)]">
                          {sec.helper}
                        </p>
                      </header>
                      <ul className="grid grid-cols-1 gap-4 xl:grid-cols-3 md:grid-cols-2">
                        {sec.items.map(({ p, info, display, next }) => (
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
                      nextActionHref={next.href}
                      nextActionLabel={next.label}
                    />
                  </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              );
            })()}
          </>
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
  projectId: string;
  name: string;
  category: string;
  updatedAt: Date;
  status: string;
  statusLabel: string;
  statusVariant: "default" | "warn" | "live";
  statusHelp?: string;
  readyPanels: number;
  totalPanels: number;
  nextActionHref: string;
  nextActionLabel: string;
}) {
  const summary = totalPanels === 0
    ? (category || "Uncategorized")
    : `${readyPanels} of ${totalPanels} panels ready`;

  const initials = name.trim().slice(0, 2).toUpperCase();

  return (
    <article
      data-project-card={projectId}
      data-project-status={status}
      data-panels-ready={String(readyPanels)}
      data-panels-total={String(totalPanels)}
      className="group surface overflow-hidden transition-colors hover:bg-[var(--bg-3)]"
    >
      <Link href={`/projects/${projectId}`} className="block border-b border-[var(--line)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-[color-mix(in_srgb,var(--accent)_12%,var(--bg-3))] text-[16px] font-semibold text-[var(--accent)]">
            {initials || "SH"}
          </div>
          <Badge variant={statusVariant} title={statusHelp}>{statusLabel}</Badge>
        </div>

        <div className="mt-6">
          <h2 className="truncate text-[18px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
            {name}
          </h2>
          <p className="mt-2 text-[14px] leading-[1.55] text-[var(--fg-dim)]">
            {summary}
          </p>
          <div className="mt-4 text-[13px] text-[var(--fg-mute)]">
            Updated {timeAgo(updatedAt)}
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 p-5">
        <Link
          href={`/projects/${projectId}`}
          className="text-[13px] text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
        >
          Open overview
        </Link>
        <Link
          href={nextActionHref}
          data-next-action-label={nextActionLabel}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--accent)] transition-opacity hover:opacity-80"
        >
          {nextActionLabel}
          <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60_000);
  const hour = Math.floor(diff / 3_600_000);
  const day = Math.floor(diff / 86_400_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hour < 24) return `${hour}h ago`;
  if (day < 7) return `${day}d ago`;
  return date.toISOString().slice(0, 10);
}

function EmptyProjects() {
  return (
    <div className="surface-raised px-6 py-10 sm:px-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-2 text-[13px] text-[var(--fg-mute)]">Nothing here yet</p>
          <h2 className="text-[clamp(1.75rem,3.8vw,2.6rem)] font-semibold tracking-[-0.035em] text-[var(--fg)] leading-[1.04]">
            Build the first launch pack now.
          </h2>
          <p className="mt-4 max-w-[54ch] text-[15px] leading-[1.65] text-[var(--fg-dim)]">
            Projects hold the copy, frames, devices, and exports for one app release. Create one, drop in your raw screenshots, and keep going from there.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/projects/new" className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--accent)] px-5 py-3 text-[14px] font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-92">
              Start a project
              <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
            </Link>
            <Link href="/templates" className="text-[14px] text-[var(--fg-dim)] underline decoration-[var(--line-strong)] underline-offset-4 transition-colors hover:text-[var(--fg)] hover:decoration-[var(--accent)]">
              Browse templates first
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            ["Organize one launch per project", "Keep devices, copy, and exports together instead of spreading them across Figma files and folders."],
            ["Return to the next step fast", "Every card points you back to the most useful action instead of dumping you into a generic view."],
            ["Export when the pack is ready", "Once the panels are done, jump straight to exports without hunting around the interface."],
          ].map(([title, body]) => (
            <div key={title} className="surface p-4">
              <div className="text-[15px] font-medium text-[var(--fg)]">{title}</div>
              <div className="mt-2 text-[13px] leading-[1.55] text-[var(--fg-dim)]">{body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
