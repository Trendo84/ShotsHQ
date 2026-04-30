/**
 * GET /api/ai/runs/[runId] — Trigger.dev run status passthrough.
 *
 * The client polls this every ~2s while a dispatched run is in flight.
 * Returns a slim, client-safe projection of the Trigger.dev run record:
 * status (pending|running|completed|failed) plus the output payload
 * once status === "completed".
 *
 * Auth-gated. We don't currently verify the run belongs to the calling
 * user (Trigger.dev runs aren't tagged with userId at retrieval time);
 * mitigations:
 *   - Run IDs are 24-char nanoids — not enumerable by force.
 *   - Output payloads include only what the task `run()` returns,
 *     which is per-task scoped data, never raw user secrets.
 *
 * Fallback: when Trigger.dev isn't configured (local dev without
 * TRIGGER_SECRET_KEY), return `{ status: "unavailable" }` so the
 * client can render a graceful "configure Trigger.dev to run AI"
 * notice instead of erroring.
 */

import { NextRequest } from "next/server";
import { runs } from "@trigger.dev/sdk/v3";
import { requireUser } from "@/lib/auth/clerk";
import { logError } from "@/lib/observability/log";

export const runtime = "nodejs";

type ClientRunStatus = "pending" | "running" | "completed" | "failed" | "unavailable";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ runId: string }> },
) {
  try {
    await requireUser();
  } catch {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { runId } = await ctx.params;
  if (!runId || runId.length < 8) {
    return Response.json({ ok: false, error: "invalid_run_id" }, { status: 400 });
  }

  if (!process.env.TRIGGER_SECRET_KEY) {
    return Response.json({
      ok:   true,
      data: { status: "unavailable" as ClientRunStatus, output: null, error: null },
    });
  }

  try {
    const run = await runs.retrieve(runId);
    const status = mapStatus(run.status);
    return Response.json({
      ok:   true,
      data: {
        status,
        output: status === "completed" ? run.output ?? null : null,
        error:  status === "failed"    ? run.error  ?? null : null,
      },
    });
  } catch (err) {
    logError("[ai.runs] retrieve failed", err, { runId });
    return Response.json({ ok: false, error: "retrieve_failed" }, { status: 502 });
  }
}

/**
 * Trigger.dev exposes a richer state machine than we need to surface.
 * Bucket every internal status into one of four client-visible values
 * so the UI can render a deterministic loading/result switch.
 */
function mapStatus(triggerStatus: string): ClientRunStatus {
  switch (triggerStatus) {
    case "COMPLETED":
      return "completed";
    case "FAILED":
    case "CANCELED":
    case "CRASHED":
    case "INTERRUPTED":
    case "SYSTEM_FAILURE":
    case "TIMED_OUT":
    case "EXPIRED":
      return "failed";
    case "EXECUTING":
    case "REATTEMPTING":
    case "FROZEN":
      return "running";
    default:
      // QUEUED / PENDING_VERSION / DELAYED / WAITING_* etc.
      return "pending";
  }
}
