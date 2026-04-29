import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { Badge } from "@/components/ui/badge";
import { Download, RotateCw, Upload } from "lucide-react";

export default async function ExportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Stub data
  const targets = [
    { id: "iphone_69", label: "iPhone 6.9″", dim: "1290 × 2796", count: 8, size: "12.4 MB" },
    { id: "iphone_67", label: "iPhone 6.7″", dim: "1320 × 2868", count: 8, size: "13.1 MB" },
    { id: "ipad_13",   label: "iPad 13″",    dim: "2064 × 2752", count: 8, size: "21.7 MB" },
  ];

  const renders = [
    { id: "rndr_42d8", at: "2026-04-27 10:14", state: "DONE",     locales: 12, dur: "3.1s", size: "47.2 MB" },
    { id: "rndr_3a91", at: "2026-04-26 18:02", state: "DONE",     locales: 8,  dur: "2.9s", size: "31.6 MB" },
    { id: "rndr_1c00", at: "2026-04-22 09:41", state: "FAILED",   locales: 1,  dur: "—",     size: "—" },
  ];

  return (
    <>
      <Topbar section="EXPORTS" breadcrumb={["OPERATOR", "PROJECTS", "Tideline", "EXPORTS"]} />

      <div className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="t-mono-xs text-[var(--accent)] mb-2">[ MODULE / 03-EXPORTS ]</div>
          <h1 className="t-display-xl text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[0.9]">EXPORT<br />MATRIX</h1>
        </div>
        <aside className="col-span-12 md:col-span-5 p-6 md:p-10 flex flex-col justify-end gap-3">
          <p className="t-mono-md text-[var(--fg-dim)]">
            SERVER-SIDE <code>sharp</code> RENDER. STREAMING TO R2. CLIENT
            CANVAS NEVER PRODUCES FINAL ASSETS.
          </p>
          <div className="flex gap-2">
            <button className="btn btn-accent flex-1"><RotateCw size={12} /> RENDER NOW</button>
            <button className="btn flex-1"><Upload size={12} /> PUSH ASC</button>
          </div>
        </aside>
      </div>

      {/* Targets */}
      <section className="grid grid-cols-1 md:grid-cols-3 grid-rule">
        {targets.map((t) => (
          <article key={t.id} className="p-6 min-h-[260px] flex flex-col justify-between">
            <header className="flex justify-between items-start">
              <span className="t-mono-xs text-[var(--fg-mute)]">{t.id.toUpperCase()}</span>
              <Badge variant="live">READY</Badge>
            </header>
            <div>
              <div className="t-display text-[28px] leading-tight">{t.label}</div>
              <div className="t-mono-xs text-[var(--fg-mute)] mt-1 t-numeric">{t.dim}</div>
            </div>
            <dl className="dl-rule">
              <div><dt>FRAMES</dt><dd className="t-numeric">{t.count}</dd></div>
              <div><dt>BUNDLE</dt><dd>{t.size}</dd></div>
            </dl>
            <button className="btn w-full"><Download size={12} /> DOWNLOAD ZIP</button>
          </article>
        ))}
      </section>

      {/* Render history */}
      <section>
        <div className="px-6 py-3 border-y border-[var(--line)] flex items-center justify-between">
          <span className="t-mono-xs text-[var(--accent)]">[ RENDER HISTORY ]</span>
          <span className="t-mono-xs text-[var(--fg-mute)]">{renders.length} ENTRIES</span>
        </div>
        <ul>
          {renders.map((r) => (
            <li key={r.id} className="grid grid-cols-12 items-center gap-3 px-6 py-4 border-b border-[var(--line)]">
              <div className="col-span-3 md:col-span-2 t-mono-xs text-[var(--fg-mute)]">{r.at}</div>
              <div className="col-span-3 md:col-span-3 t-mono-sm text-[var(--fg)]">{r.id}</div>
              <div className="col-span-2 md:col-span-2 t-mono-xs text-[var(--fg-mute)]">{r.locales} LOCALES</div>
              <div className="col-span-2 md:col-span-2 t-mono-xs text-[var(--fg-mute)] t-numeric">{r.dur}</div>
              <div className="col-span-1 md:col-span-1 t-mono-xs text-[var(--fg-mute)] t-numeric">{r.size}</div>
              <div className="col-span-1 md:col-span-2 flex justify-end">
                {r.state === "DONE"   && <Badge variant="live">{r.state}</Badge>}
                {r.state === "FAILED" && <Badge variant="warn">{r.state}</Badge>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="px-6 py-4 t-mono-xs text-[var(--fg-mute)]">
        <Link href={`/projects/${id}`} className="link-tick">← BACK TO PROJECT</Link>
      </div>
    </>
  );
}
