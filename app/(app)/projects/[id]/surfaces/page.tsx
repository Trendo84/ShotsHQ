import { Topbar } from "@/components/app/Topbar";
import { SurfaceMatrix } from "@/components/surfaces/SurfaceMatrix";

export default async function SurfacesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <Topbar
        section="Surfaces"
        breadcrumb={["Operator", "Projects", id.slice(0, 8), "Surfaces"]}
      />

      <div className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="t-eyebrow t-eyebrow-accent mb-2">Project · Surfaces</div>
          <h1 className="t-display t-h-2">
            Choose your<br />
            <span className="text-[var(--accent)]">channels.</span>
          </h1>
          <p className="t-prose text-[var(--fg-dim)] mt-4 max-w-xl leading-relaxed">
            Pick every channel you want this project to ship to. Same source
            screens, every aspect, one render pass.
          </p>
        </div>
        <aside className="col-span-12 md:col-span-5 p-6 md:p-10 flex items-end">
          <p className="t-prose text-[var(--fg-dim)] leading-relaxed">
            App Store screenshots are always rendered. Other surfaces unlock
            on the Indie pack and above. Studio includes the full press kit.
          </p>
        </aside>
      </div>

      <SurfaceMatrix projectId={id} />
    </>
  );
}
