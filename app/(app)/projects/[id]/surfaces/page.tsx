import { Topbar } from "@/components/app/Topbar";
import { SurfaceMatrix } from "@/components/surfaces/SurfaceMatrix";

export default async function SurfacesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <Topbar
        section="SURFACES"
        breadcrumb={["OPERATOR", "PROJECTS", id.toUpperCase(), "SURFACES"]}
      />

      <div className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="t-mono-xs text-[var(--accent)] mb-2">[ MODULE / 04-SURFACES ]</div>
          <h1 className="t-display-xl text-[clamp(2rem,5vw,4rem)] leading-[0.9]">
            CHOOSE<br />SURFACES
          </h1>
          <p className="t-mono-md text-[var(--fg-dim)] mt-4 max-w-xl leading-relaxed">
            Pick every channel you want this project to ship to. Same source
            screens, every aspect, one render pass.
          </p>
        </div>
        <aside className="col-span-12 md:col-span-5 p-6 md:p-10 flex items-end">
          <p className="t-mono-sm text-[var(--fg-mute)] leading-relaxed">
            App Store screenshots are always rendered. Other surfaces unlock
            on the Indie pack and above. Studio includes the full press kit.
          </p>
        </aside>
      </div>

      <SurfaceMatrix projectId={id} />
    </>
  );
}
