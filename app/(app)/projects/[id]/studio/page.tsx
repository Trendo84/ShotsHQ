import { notFound } from "next/navigation";
import { Topbar } from "@/components/app/Topbar";
import { StudioClient } from "@/components/studio/StudioClient";
import { requireUser } from "@/lib/auth/clerk";
import { getProject } from "@/lib/db/queries/projects";

/**
 * ShotsHQ Studio — ASOForge-style constrained screenshot engine.
 *
 * Phase A is intentionally local-state only: it proves the superior
 * creative engine can live inside the product shell and export exact
 * App Store pixel dimensions for the three locked device classes.
 */
export default async function ProjectStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const project = await getProject(id, user.id);
  if (!project) notFound();

  return (
    <>
      <Topbar section="Studio" breadcrumb={["Operator", "Projects", project.name, "Studio"]} />
      <StudioClient
        projectId={project.id}
        projectName={project.name}
        appName={project.appName}
        appDescription={project.appDescription}
      />
    </>
  );
}
