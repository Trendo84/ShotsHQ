import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/app/Topbar";
import { Badge } from "@/components/ui/badge";
import { Download, RotateCw, Upload } from "lucide-react";
import { requireUser } from "@/lib/auth/clerk";
import { getProject } from "@/lib/db/queries/projects";

const TARGETS = [
  { id: "iphone_69", label: "iPhone 6.9″", dim: "1290 × 2796" },
  { id: "iphone_67", label: "iPhone 6.7″", dim: "1320 × 2868" },
  { id: "ipad_13",   label: "iPad 13″",    dim: "2064 × 2752" },
];

export default async function ExportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }    = await params;
  const user      = await requireUser();
  const project   = await getProject(id, user.id);
  if (!project) notFound();

  const activeTargets = project.storeTargets ?? [];

  return (
    <>
      <Topbar section="EXPORTS" breadcrumb={["OPERATOR", "PROJECTS", project.name, "EXPORTS"]} />

      <div className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-7 border-r-0 md:border-r border-[var(--line)] p-5 sm:p-6 md:p-10">
          <div className="t-mono-xs text-[var(--accent)] mb-2">[ MODULE / 03-EXPORTS ]</div>
          <h1 className="t-display text-[clamp(2rem,5.5vw,4.5rem)] leading-[0.92] text-balance">
            EXPORT<br />MATRIX
          </h1>
        </div>
        <aside className="col-span-12 md:col-span-5 p-5 sm:p-6 md:p-10 flex flex-col justify-end gap-3 border-t md:border-t-0 border-[var(--line)]">
          <p className="t-mono-md text-[var(--fg-dim)]">
            Server-side <code>sharp</code> render. Streaming to R2. Client
            canvas never produces final assets.
          </p>
          <div className="flex gap-2">
            <button className="btn btn-accent flex-1"><RotateCw size={12} /> RENDER NOW</button>
            <button className="btn flex-1"><Upload size={12} /> PUSH ASC</button>
          </div>
        </aside>
      </div>

      {/* Targets */}
      <section className="grid grid-cols-1 md:grid-cols-3 grid-rule">
        {TARGETS.map((t) => {
          const enabled = activeTargets.includes(t.id);
          return (
            <article
              key={t.id}
              className={`p-5 sm:p-6 min-h-[220px] sm:min-h-[260px] flex flex-col justify-between gap-4 ${
                enabled ? "" : "opacity-50"
              }`}
            >
              <header className="flex justify-between items-start gap-3">
                <span className="t-mono-xs text-[var(--fg-mute)] truncate">{t.id.toUpperCase()}</span>
                {enabled
                  ? <Badge variant="live">READY</Badge>
                  : <Badge>NOT TARGETED</Badge>}
              </header>
              <div className="min-w-0">
                <div className="t-display text-[clamp(1.5rem,2.8vw,1.75rem)] leading-tight truncate">{t.label}</div>
                <div className="t-mono-xs text-[var(--fg-mute)] mt-1 t-numeric">{t.dim}</div>
              </div>
              <dl className="dl-rule">
                <div><dt>FRAMES</dt><dd className="t-numeric">0</dd></div>
                <div><dt>BUNDLE</dt><dd className="t-mono-xs">— KB</dd></div>
              </dl>
              <button
                disabled={!enabled}
                className="btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={12} /> DOWNLOAD ZIP
              </button>
            </article>
          );
        })}
      </section>

      {/* Render history */}
      <section>
        <div className="px-5 sm:px-6 py-3 border-y border-[var(--line)] flex items-center justify-between flex-wrap gap-2">
          <span className="t-mono-xs text-[var(--accent)]">[ RENDER HISTORY ]</span>
          <span className="t-mono-xs text-[var(--fg-mute)]">0 ENTRIES</span>
        </div>
        <div className="px-5 sm:px-6 py-12 sm:py-16 text-center">
          <div className="t-eyebrow t-eyebrow-accent mb-2">No renders yet</div>
          <p className="t-mono-sm text-[var(--fg-mute)] max-w-md mx-auto">
            When you click <strong>RENDER NOW</strong>, the run history streams
            here in real time — duration, locales, output size, status.
          </p>
        </div>
      </section>

      <div className="px-5 sm:px-6 py-4 t-mono-xs text-[var(--fg-mute)]">
        <Link href={`/projects/${id}`} className="link-tick">← BACK TO PROJECT</Link>
      </div>
    </>
  );
}
