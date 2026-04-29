"use server";

import { requireUser } from "@/lib/auth/clerk";
import { updateProjectCanvas } from "@/lib/db/queries/projects";
import type { ShotsCanvas } from "@/lib/canvas/schema";

/** Persist the canvas JSON for a project. Called by the editor's auto-save. */
export async function saveCanvas(projectId: string, json: ShotsCanvas): Promise<void> {
  const user = await requireUser();
  await updateProjectCanvas(projectId, user.id, json);
}
