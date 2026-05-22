import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/clerk";
import { getProject } from "@/lib/db/queries/projects";

/**
 * Studio-first redirect.
 *
 * Phase B makes the constrained Studio engine the default editing surface.
 * The legacy Fabric route is intentionally retired from the normal product path.
 */
export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const project = await getProject(id, user.id);
  if (!project) notFound();

  redirect(`/projects/${id}/studio`);
}
