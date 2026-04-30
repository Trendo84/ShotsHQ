import { notFound } from "next/navigation";
import { EditorTopbar } from "@/components/editor/EditorTopbar";
import { EditorClient } from "@/components/editor/EditorClient";
import { requireUser } from "@/lib/auth/clerk";
import { getProject } from "@/lib/db/queries/projects";
import { validateShotsCanvas } from "@/lib/canvas/schema";
import { logError } from "@/lib/observability/log";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user    = await requireUser();
  const project = await getProject(id, user.id);
  if (!project) notFound();

  // Validate `polotnoJson` shape before passing to the editor. Without
  // this, malformed JSONB (older save format, manual SQL edit, schema
  // drift) would throw inside FabricCanvas's mount loop and the route
  // would crash — see audit finding
  // `docs/audits/2026-04-30-comet-sonnet-editor.md` #2. The error
  // boundary at ./error.tsx now also catches uncaught throws as
  // belt-and-suspenders.
  //
  // On validation failure: log + fall back to `null` (editor seeds
  // `defaultCanvas()`). User sees a fresh canvas instead of a broken
  // page; we get a Sentry breadcrumb to investigate the malformed row.
  const canvas = project.polotnoJson === null || project.polotnoJson === undefined
    ? null
    : validateShotsCanvas(project.polotnoJson) ?? (() => {
        logError("[editor] malformed polotnoJson; falling back to defaultCanvas", null, {
          projectId: id,
          userId:    user.id,
          // Don't log the raw JSONB — could be large + might contain user copy.
          // The keys list is enough to triage shape drift.
          jsonbKeys: typeof project.polotnoJson === "object" && project.polotnoJson !== null
            ? Object.keys(project.polotnoJson as Record<string, unknown>)
            : [],
        });
        return null;
      })();

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
