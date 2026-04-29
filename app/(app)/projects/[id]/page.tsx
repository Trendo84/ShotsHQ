import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Edit3, Sparkles, Download, Globe, Layers } from "lucide-react";

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Stub data — replace with db query.
  const project = {
    id,
    name: "Tideline",
    category: "Surf reports",
    description: "The fastest local surf forecast. Wave height, tide, wind. Apple Watch sync.",
    created: "2026-04-08",
    updated: "2026-04-27 10:14",
    targets: ["iphone_69", "iphone_67", "ipad_13"],
    locales: ["en", "fr", "de", "es", "ja", "pt-BR", "ko", "zh-Hans", "it", "nl", "ar", "he"],
    screenshots: 8,
    status: "READY" as const,
  };

  const ACTIONS = [
    { href: `/projects/${id}/editor`,    icon: Edit3,    label: "Open editor", desc: "Polotno canvas",            code: "01" },
    { href: `/projects/${id}/ai`,        icon: Sparkles, label: "AI panel",    desc: "Copy, backdrop, restyle",   code: "02" },
    { href: `/projects/${id}/surfaces`,  icon: Layers,   label: "Surfaces",    desc: "App Store + web + social",  code: "03" },
    { href: `/projects/${id}/exports`,   icon: Download, label: "Exports",     desc: "Render and download",       code: "04" },
    { href: `/projects/${id}/ai#i18n`,   icon: Globe,    label: "Translate",   desc: "41-locale fan-out",         code: "05" },
  ];

  return (
    <>
      <Topbar section="PROJECT" breadcrumb={["OPERATOR", "PROJECTS", project.name]} />

      <div className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="t-mono-xs text-[var(--fg-mute)]">[ {project.id} ]</span>
            <Badge variant="live">{project.status}</Badge>
          </div>
          <h1 className="t-display text-[clamp(2.25rem,6vw,5.5rem)] leading-[0.92] normal-case tracking-[-0.04em] break-words">{project.name}.</h1>
          <p className="t-mono-md text-[var(--fg-dim)] mt-4 max-w-xl">{project.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/projects/${id}/editor`}
              className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-5 pr-1.5 py-2 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              <span className="btn-label">Open editor</span>
              <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform group-hover:translate-x-0.5 font-bold">→</span>
            </Link>
            <Link href={`/projects/${id}/ai`} className="btn text-[12px] tracking-[0.04em] normal-case">AI panel</Link>
            <Link href={`/projects/${id}/exports`} className="btn text-[12px] tracking-[0.04em] normal-case">Exports</Link>
          </div>
        </div>
        <aside className="col-span-12 md:col-span-5 p-6 md:p-10 grid grid-cols-2 gap-y-4 gap-x-2 content-between">
          <Stat label="CATEGORY" value={project.category} />
          <Stat label="CREATED"  value={project.created}  numeric />
          <Stat label="UPDATED"  value={project.updated}  numeric />
          <Stat label="SHOTS"    value={String(project.screenshots)} numeric />
          <Stat label="TARGETS"  value={String(project.targets.length)} numeric />
          <Stat label="LOCALES"  value={String(project.locales.length)} numeric />
        </aside>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 grid-rule">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.label} href={a.href} className="p-6 min-h-[200px] flex flex-col justify-between hover:bg-[var(--bg-2)] transition-colors">
              <header className="flex items-start justify-between">
                <Icon size={24} className="text-[var(--accent)]" />
                <span className="t-mono-xs text-[var(--fg-mute)]">{a.code}</span>
              </header>
              <div>
                <div className="t-display text-[26px] leading-[0.95] normal-case tracking-[-0.02em]">{a.label}</div>
                <div className="text-[12px] text-[var(--fg-mute)] mt-1">{a.desc}</div>
              </div>
              <ChevronRight size={16} className="text-[var(--fg-mute)] self-end" />
            </Link>
          );
        })}
      </section>

      <section className="grid grid-cols-12 border-t-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-8 border-r border-[var(--line)]">
          <div className="px-6 py-3 border-b border-[var(--line)] flex items-center justify-between">
            <span className="t-mono-xs text-[var(--accent)]">[ SHOT GRID ]</span>
            <span className="t-mono-xs text-[var(--fg-mute)]">{project.screenshots} / 24 SLOTS</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-rule">
            {Array.from({ length: project.screenshots }).map((_, i) => (
              <ShotTile key={i} index={i + 1} />
            ))}
            {Array.from({ length: Math.max(0, 8 - project.screenshots) }).map((_, i) => (
              <EmptyTile key={`e${i}`} />
            ))}
          </div>
        </div>
        <aside className="col-span-12 md:col-span-4">
          <div className="px-6 py-3 border-b border-[var(--line)]">
            <span className="t-mono-xs text-[var(--accent)]">[ LOCALES MATRIX ]</span>
          </div>
          <div className="grid grid-cols-3 grid-rule">
            {project.locales.map((l) => (
              <div key={l} className="p-3 t-mono-xs flex items-center justify-between">
                <span className="text-[var(--fg)]">{l.toUpperCase()}</span>
                <span className="text-[var(--signal)]">◯</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--line)] p-4">
            <button className="btn w-full text-[11px]">+ ADD LOCALE</button>
          </div>
        </aside>
      </section>
    </>
  );
}

function Stat({ label, value, numeric = false }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="border-b border-[var(--line)] pb-3">
      <dt className="t-mono-xs text-[var(--fg-mute)]">{label}</dt>
      <dd className={`t-mono-md text-[var(--fg)] mt-1 ${numeric ? "t-numeric" : ""}`}>{value}</dd>
    </div>
  );
}

function ShotTile({ index }: { index: number }) {
  return (
    <div className="aspect-[9/19.5] bg-[var(--bg-2)] flex flex-col p-3 relative group cursor-pointer">
      <div className="absolute inset-0 m-3 border border-[var(--line)] flex items-center justify-center">
        <div className="text-center">
          <div className="t-mono-xs text-[var(--fg-mute)]">FRAME</div>
          <div className="t-display text-[28px] leading-tight t-numeric">{String(index).padStart(2, "0")}</div>
        </div>
      </div>
      <div className="relative z-10 mt-auto t-mono-xs text-[var(--fg-mute)] flex justify-between">
        <span>EN</span>
        <span className="text-[var(--signal)]">OK</span>
      </div>
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
