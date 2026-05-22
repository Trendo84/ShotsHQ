import { notFound } from "next/navigation";
import { Topbar } from "@/components/app/Topbar";
import { StudioClient } from "@/components/studio/StudioClient";
import { requireUser } from "@/lib/auth/clerk";
import { getProject } from "@/lib/db/queries/projects";
import { extractStudioDesignSet } from "@/lib/studio/schema";

/**
 * ShotsHQ Studio — ASOForge-style constrained screenshot engine.
 *
 * Phase C: ordered panel set with filmstrip, reordering, duplication,
 * deletion, and bulk export naming.
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

  const initialStudio = extractStudioDesignSet(project.polotnoJson);

  return (
    <>
      <Topbar section="Studio" breadcrumb={["Operator", "Projects", project.name, "Studio"]} />
      <StudioClient
        projectId={project.id}
        projectName={project.name}
        appName={project.appName}
        appDescription={project.appDescription}
        initialStudio={initialStudio}
      />
    </>
  );
}
