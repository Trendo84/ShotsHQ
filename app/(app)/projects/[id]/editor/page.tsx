import { notFound } from "next/navigation";
import { EditorTopbar } from "@/components/editor/EditorTopbar";
import { EditorClient } from "@/components/editor/EditorClient";
import { requireUser } from "@/lib/auth/clerk";
import { getProject } from "@/lib/db/queries/projects";
import type { ShotsCanvas } from "@/lib/canvas/schema";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user    = await requireUser();
  const project = await getProject(id, user.id);
  if (!project) notFound();

  const canvas = (project.polotnoJson ?? null) as ShotsCanvas | null;

  return (
    <div className="flex flex-col h-full min-h-0 flex-1">
      <EditorTopbar projectId={id} projectName={project.name} />
      <div className="flex-1 min-h-0 flex">
        <EditorClient
          projectId={id}
          projectName={project.name}
          initialCanvas={canvas}
        />
      </div>
    </div>
  );
}
