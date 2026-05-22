"use server";

import { requireUser } from "@/lib/auth/clerk";
import { getProject, updateProjectCanvas } from "@/lib/db/queries/projects";
import { mergeStudioIntoProjectJson } from "@/lib/studio/schema";
import type { StudioDesign } from "@/components/studio/types";

/** Persist the Phase B studio design into the project's JSON payload. */
export async function saveStudio(projectId: string, studio: StudioDesign): Promise<void> {
  const user = await requireUser();
  const project = await getProject(projectId, user.id);
  if (!project) throw new Error("project_not_found");

  const merged = mergeStudioIntoProjectJson(project.polotnoJson, studio);
  await updateProjectCanvas(projectId, user.id, merged);
}
