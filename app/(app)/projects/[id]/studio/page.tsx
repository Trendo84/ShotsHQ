import { notFound } from "next/navigation";
import { StudioClient } from "@/components/studio/StudioClient";
import { requireUser } from "@/lib/auth/clerk";
import { getProject } from "@/lib/db/queries/projects";
import { extractStudioDesignSet } from "@/lib/studio/schema";

/**
 * Studio — the screenshot pack engine.
 *
 * Constrained workflow: each App Store screenshot is one ordered panel
 * with a device, source PNG, headline, and layout. The studio supports
 * filmstrip selection, reordering, duplication, deletion, and bulk
 * export at App Store-exact dimensions.
 *
 * Structural redesign 2026-05-24: dropped the legacy `<Topbar>` header
 * row — the AppNav at layout level is enough, and Studio benefits from
 * the extra vertical space when it can have the whole content area.
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
    <StudioClient
      projectId={project.id}
      projectName={project.name}
      appName={project.appName}
      appDescription={project.appDescription}
      initialStudio={initialStudio}
    />
  );
}
