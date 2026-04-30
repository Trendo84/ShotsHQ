import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/app/Topbar";
import { AiModulesClient } from "@/components/ai/AiModulesClient";
import { requireUser } from "@/lib/auth/clerk";
import { getProject } from "@/lib/db/queries/projects";

/**
 * AI dispatch page. Server-rendered shell pulls the project metadata
 * (appName, description, category) so the client component can
 * pre-fill the dispatch payload — no extra round-trip on click.
 */
export default async function AiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user    = await requireUser();
  const project = await getProject(id, user.id);
  if (!project) notFound();

  return (
    <>
      <Topbar
        section="AI panel"
        breadcrumb={["Operator", "Projects", project.name, "AI"]}
      />

      <AiModulesClient
        projectId={id}
        appName={project.appName}
        appDescription={project.appDescription}
        category={project.category}
      />

      <div className="px-6 py-4 t-mono-xs text-[var(--fg-mute)] flex justify-between flex-wrap gap-2">
        <span className="truncate">PROJECT · {id}</span>
        <Link href={`/projects/${id}`} className="link-tick">← OVERVIEW</Link>
      </div>
    </>
  );
}
