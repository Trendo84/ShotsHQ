import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/app/Topbar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Sparkles, Download, Globe, Layers, Smartphone } from "lucide-react";
import { requireUser } from "@/lib/auth/clerk";
import { getProject } from "@/lib/db/queries/projects";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }   = await params;
  const user     = await requireUser();
  const project  = await getProject(id, user.id);
  if (!project) notFound();

  const targets  = project.storeTargets ?? [];
  const created  = project.createdAt.toISOString().slice(0, 10);
  const updated  = project.updatedAt.toISOString().slice(0, 16).replace("T", " ");

  const ACTIONS = [
    { href: `/projects/${id}/studio`, icon: Smartphone, label: "Open studio", desc: "Constrained screenshot engine", code: "01" },
    { href: `/projects/${id}/ai`,     icon: Sparkles,   label: "AI panel",    desc: "Copy, backdrop, restyle",        code: "02" },
    { href: `/projects/${id}/surfaces`, icon: Layers,   label: "Surfaces",    desc: "App Store + web + social",       code: "03" },
    { href: `/projects/${id}/exports`, icon: Download,  label: "Exports",     desc: "Render and download",            code: "04" },
    { href: `/projects/${id}/ai#i18n`, icon: Globe,     label: "Translate",   desc: "41-locale fan-out",              code: "05" },
  ];

  return (
    <>
      <Topbar section="Project" breadcrumb={["Operator", "Projects", project.name]} />

      <div className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-7 border-r-0 md:border-r border-[var(--line)] p-5 sm:p-6 md:p-10">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="t-mono-xs text-[var(--fg-mute)]">[ {project.id.slice(0, 8)} ]</span>
            <Badge>DRAFT</Badge>
          </div>
          <h1 className="t-display text-[clamp(2rem,6vw,5.5rem)] leading-[0.92] normal-case tracking-[-0.04em] break-words text-balance">
            {project.name}.
          </h1>
          {project.appDescription && (
            <p className="t-mono-md text-[var(--fg-dim)] mt-4 max-w-xl">{project.appDescription}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/projects/${id}/studio`}
              className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-5 pr-1.5 py-2 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              <span className="btn-label">Open studio</span>
              <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform group-hover:translate-x-0.5 font-bold">→</span>
            </Link>
            <Link href={`/projects/${id}/studio`} className="btn text-[12px] tracking-[0.04em] normal-case">Studio</Link>
            <Link href={`/projects/${id}/ai`} className="btn text-[12px] tracking-[0.04em] normal-case">AI panel</Link>
            <Link href={`/projects/${id}/exports`} className="btn text-[12px] tracking-[0.04em] normal-case">Exports</Link>
          </div>
        </div>
        <aside className="col-span-12 md:col-span-5 p-5 sm:p-6 md:p-10 grid grid-cols-2 gap-y-4 gap-x-2 content-between border-t md:border-t-0 border-[var(--line)]">
          <Stat label="CATEGORY" value={project.category ?? "—"} />
          <Stat label="CREATED"  value={created}  numeric />
          <Stat label="UPDATED"  value={updated}  numeric />
          <Stat label="TARGETS"  value={String(targets.length).padStart(2, "0")} numeric />
          <Stat label="APP NAME" value={project.appName ?? "—"} />
          <Stat label="ID"       value={project.id.slice(0, 8)} numeric />
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
              <ChevronRight size={16} className="text-[var(--fg-mute)] self-end" />
            </Link>
          );
        })}
      </section>

      <section className="grid grid-cols-12 border-t-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-8 border-r-0 md:border-r border-[var(--line)]">
          <div className="px-5 sm:px-6 py-3 border-b border-[var(--line)] flex items-center justify-between flex-wrap gap-2">
            <span className="t-eyebrow t-eyebrow-accent">Shot grid</span>
            <span className="t-mono-xs text-[var(--fg-mute)]">0 / 24 slots</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-rule">
            {Array.from({ length: 8 }).map((_, i) => (
              <EmptyTile key={`e${i}`} />
            ))}
          </div>
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
              {targets.map((t) => (
                <div key={t} className="p-3 t-mono-xs flex items-center justify-between">
                  <span className="text-[var(--fg)]">{t.toUpperCase().replace(/_/g, " ")}</span>
                  <span className="text-[var(--signal)]">◯ READY</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </>
  );
}

function Stat({ label, value, numeric = false }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="border-b border-[var(--line)] pb-3 min-w-0">
      <dt className="t-mono-xs text-[var(--fg-mute)]">{label}</dt>
      <dd className={`t-mono-md text-[var(--fg)] mt-1 truncate ${numeric ? "t-numeric" : ""}`}>{value}</dd>
    </div>
  );
}

function EmptyTile() {
  return (
    <div className="aspect-[9/19.5] bg-[var(--bg-2)] flex items-center justify-center border-2 border-dashed border-[var(--line)]">
      <span className="t-mono-xs text-[var(--fg-mute)]">+ EMPTY</span>
    </div>
  );
}
