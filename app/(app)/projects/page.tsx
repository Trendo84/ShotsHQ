import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

const PROJECTS = [
  { id: "p_01", name: "Tideline",   category: "Surf reports",     updated: "2026-04-27 10:14", screenshots: 8,  locales: 12, status: "READY" },
  { id: "p_02", name: "FocusForge", category: "Productivity",     updated: "2026-04-26 18:02", screenshots: 24, locales: 8,  status: "RENDERING" },
  { id: "p_03", name: "Lentil",     category: "Grocery inventory",updated: "2026-04-22 09:41", screenshots: 5,  locales: 1,  status: "DRAFT" },
  { id: "p_04", name: "Sundial",    category: "Habit tracker",    updated: "2026-04-19 14:55", screenshots: 16, locales: 18, status: "READY" },
  { id: "p_05", name: "MorseField", category: "Ham radio toolkit",updated: "2026-04-12 11:08", screenshots: 12, locales: 6,  status: "READY" },
  { id: "p_06", name: "Brassline",  category: "Trumpet practice", updated: "2026-04-04 17:23", screenshots: 7,  locales: 4,  status: "ARCHIVED" },
];

export default function ProjectsPage() {
  return (
    <>
      <Topbar section="PROJECTS" breadcrumb={["OPERATOR", "PROJECTS"]} />

      <div className="grid grid-cols-12 border-b border-[var(--line)]">
        <div className="col-span-12 md:col-span-8 border-r border-[var(--line)] p-6">
          <div className="t-mono-xs text-[var(--accent)] mb-2">[ PROJECTS / INDEX ]</div>
          <h1 className="t-display text-[clamp(2rem,4vw,3.5rem)]">PROJECT INDEX</h1>
          <p className="t-mono-sm text-[var(--fg-mute)] mt-2">{PROJECTS.length} ACTIVE · ALL SLOTS UNDER CAPACITY</p>
        </div>
        <div className="col-span-12 md:col-span-4 p-6 flex items-center justify-end gap-3">
          <Link href="/projects/new" className="btn btn-accent"><Plus size={12} /> NEW PROJECT</Link>
        </div>
      </div>

      {PROJECTS.length === 0 ? (
        <EmptyProjects />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 grid-rule">
          {PROJECTS.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="p-6 min-h-[220px] flex flex-col justify-between hover:bg-[var(--bg-2)] transition-colors group focus-visible:outline-none focus-visible:bg-[var(--bg-2)] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
            >
              <header className="flex items-start justify-between">
                <div>
                  <div className="t-mono-xs text-[var(--fg-mute)]">{p.id}</div>
                  <h2 className="t-display text-[28px] leading-[0.9] mt-1">{p.name}</h2>
                  <div className="t-mono-xs text-[var(--fg-mute)] mt-1">{p.category}</div>
                </div>
                {p.status === "READY"     && <Badge variant="live">{p.status}</Badge>}
                {p.status === "RENDERING" && <Badge variant="warn">{p.status}</Badge>}
                {p.status === "DRAFT"     && <Badge>{p.status}</Badge>}
                {p.status === "ARCHIVED"  && <Badge variant="outline">{p.status}</Badge>}
              </header>

              <dl className="dl-rule mt-4">
                <div><dt>SHOTS</dt><dd className="t-numeric">{p.screenshots}</dd></div>
                <div><dt>LOCALES</dt><dd className="t-numeric">{p.locales}</dd></div>
                <div><dt>UPDATED</dt><dd>{p.updated}</dd></div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function EmptyProjects() {
  return (
    <div className="px-6 py-24 grid place-items-center">
      <div className="max-w-md text-center">
        <div className="t-eyebrow t-eyebrow-accent mb-3">No projects yet</div>
        <h2 className="t-display text-[clamp(1.75rem,4vw,2.5rem)] leading-[0.95] mb-4">
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
