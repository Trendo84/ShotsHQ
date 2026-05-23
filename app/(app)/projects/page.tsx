import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/clerk";
import { listProjectsForUser } from "@/lib/db/queries/projects";
import {
  projectStatus,
  projectStatusDisplay,
} from "@/lib/studio/project-status";

export default async function ProjectsPage() {
  const user     = await requireUser();
  const projects = await listProjectsForUser(user.id);

  return (
    <>
      <Topbar section="Projects" breadcrumb={["Operator", "Projects"]} />

      <div className="grid grid-cols-12 border-b border-[var(--line)]">
        <div className="col-span-12 md:col-span-8 border-r-0 md:border-r border-[var(--line)] p-5 md:p-6">
          <div className="t-eyebrow t-eyebrow-accent mb-2">Operator · Projects</div>
          <h1 className="t-display text-[clamp(1.75rem,4vw,3.5rem)] leading-[0.95] text-balance">
            PROJECT INDEX
          </h1>
          <p className="t-mono-sm text-[var(--fg-mute)] mt-2">
            {projects.length === 0
              ? "NO ACTIVE PROJECTS · READY TO COMMISSION"
              : `${projects.length} ACTIVE · ALL SLOTS UNDER CAPACITY`}
          </p>
        </div>
        <div className="col-span-12 md:col-span-4 p-5 md:p-6 flex items-center justify-end gap-3 border-t md:border-t-0 border-[var(--line)]">
          <Link href="/projects/new" className="btn btn-accent"><Plus size={12} /> NEW PROJECT</Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyProjects />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 grid-rule">
          {projects.map((p) => {
            // Same truth source as /dashboard and /projects/[id].
            // Audit cycle #5: this card used to hardcode "DRAFT"
            // on every project regardless of real state.
            const info    = projectStatus(p.polotnoJson);
            const display = projectStatusDisplay(info, p.id);
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                data-project-card={p.id}
                data-project-status={info.status}
                data-panels-ready={String(info.readiness.readyPanels)}
                data-panels-total={String(info.readiness.totalPanels)}
                className="p-5 sm:p-6 min-h-[200px] sm:min-h-[220px] flex flex-col justify-between hover:bg-[var(--bg-2)] transition-colors group focus-visible:outline-none focus-visible:bg-[var(--bg-2)] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="t-mono-xs text-[var(--fg-mute)] truncate">{p.id.slice(0, 8)}</div>
                    <h2 className="t-display text-[clamp(1.5rem,3vw,1.75rem)] leading-[0.95] mt-1 normal-case tracking-[-0.02em] break-words">
                      {p.name}
                    </h2>
                    <div className="t-mono-xs text-[var(--fg-mute)] mt-1 truncate">
                      {p.category ?? "Uncategorized"}
                    </div>
                  </div>
                  <Badge variant={display.variant} title={display.help}>{display.label}</Badge>
                </header>

                <dl className="dl-rule mt-4">
                  <div><dt>TARGETS</dt><dd className="t-numeric">{p.storeTargets?.length ?? 0}</dd></div>
                  <div>
                    <dt>READY</dt>
                    <dd className="t-numeric">
                      {String(info.readiness.readyPanels).padStart(2, "0")} / {String(info.readiness.totalPanels).padStart(2, "0")}
                    </dd>
                  </div>
                  <div><dt>UPDATED</dt><dd className="t-numeric">{p.updatedAt.toISOString().slice(0, 10)}</dd></div>
                </dl>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function EmptyProjects() {
  return (
    <div className="px-4 sm:px-6 py-16 sm:py-24 grid place-items-center">
      <div className="max-w-md text-center">
        <div className="t-eyebrow t-eyebrow-accent mb-3">No projects yet</div>
        <h2 className="t-display text-[clamp(1.5rem,4vw,2.5rem)] leading-[0.95] mb-4 text-balance">
          Commission your<br />first project.
        </h2>
        <p className="t-prose mb-6">
          Drop in raw iOS screens, pick devices and surfaces, ship.
          Your first project takes about ninety seconds.
        </p>
        <Link
          href="/projects/new"
          className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-5 pr-1.5 py-2 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
        >
          <span className="btn-label">Start a project</span>
          <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform group-hover:translate-x-0.5 font-bold">→</span>
        </Link>
      </div>
    </div>
  );
}
