import { notFound } from "next/navigation";
import { Topbar } from "@/components/app/Topbar";
import { SurfaceMatrix } from "@/components/surfaces/SurfaceMatrix";
import { requireUser } from "@/lib/auth/clerk";
import { getProject } from "@/lib/db/queries/projects";
import { userPlanToSurfacePlan } from "@/lib/surfaces/catalog";

/**
 * /projects/[id]/surfaces — the last untouched project-scoped route
 * audited in cycle #16.
 *
 * Pre-cycle-16 lies:
 *   1. `<SurfaceMatrix>` hardcoded `userPlan = "indie"` (the file's
 *      own comment admitted it was a stub). Free users saw the Indie
 *      tier of surfaces unlocked; Studio users saw the same Indie
 *      cap. The page didn't talk to the database at all.
 *   2. Breadcrumb read "Operator / Projects / <8-char uuid slice> /
 *      Surfaces" — admin-console framing + raw IDs in prime nav
 *      real estate, both flagged in the latest UX brief.
 *
 * Post-cycle-16:
 *   - We fetch the actual project + user, derive `userPlan` from
 *     the DB user via `userPlanToSurfacePlan()` (the canonical
 *     mapper that knows the Stripe-customer-vs-Studio-vs-free
 *     distinction).
 *   - Breadcrumb reads "Projects / <project.name> / Surfaces" —
 *     same readiness language used on /studio + /exports.
 *   - 404 if the project doesn't belong to the calling user (the
 *     standard project-scope guard).
 */
export default async function SurfacesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user    = await requireUser();
  const project = await getProject(id, user.id);
  if (!project) notFound();

  const userPlan = userPlanToSurfacePlan(user);

  return (
    <>
      <Topbar
        section="Surfaces"
        breadcrumb={["Projects", project.name, "Surfaces"]}
      />

      <div
        className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]"
        data-surfaces-page-root
        data-user-plan={userPlan}
      >
        <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-2">
            {project.name} · Surfaces
          </div>
          <h1 className="t-display t-h-2">
            Choose your<br />
            <span className="text-[var(--accent)]">channels.</span>
          </h1>
          <p className="t-prose text-[var(--fg)] mt-4 max-w-xl leading-relaxed">
            Pick every channel you want this project to ship to. Same
            source screens, every aspect, one render pass.
          </p>
        </div>
        <aside className="col-span-12 md:col-span-5 p-6 md:p-10 flex items-end">
          <p className="t-prose text-[var(--fg-dim)] leading-relaxed">
            App Store screenshots are always included. Indie pack
            unlocks web hero, OG cards, and Product Hunt. Studio adds
            the full press kit.
          </p>
        </aside>
      </div>

      <SurfaceMatrix projectId={id} userPlan={userPlan} />
    </>
  );
}
