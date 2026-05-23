/**
 * POST /api/screenshots/register — register uploaded PNGs as
 * project screenshot rows.
 *
 * Capture intake. Pairs with the canonical bytes-upload route at
 * `/api/upload/direct` (and accepts keys from the legacy presigned
 * `/api/upload` path too):
 *
 *   1. Client uploads PNG bytes to /api/upload/direct
 *   2. Upload route stores the object in R2 and returns a `key`
 *   3. Client calls THIS route with the projectId + per-file
 *      { device, r2Key, width, height, locale } payload
 *   4. Route validates ownership of the project, validates the
 *      payload via Zod, inserts via `registerScreenshots()` (which
 *      handles idempotency)
 *
 * Idempotency: the underlying `registerScreenshots()` query helper
 * skips rows whose `(projectId, r2Key)` already exists. Duplicate
 * registration calls (network retries, double-clicks) resolve to the
 * existing row's id so the client can land in the editor with a
 * complete frame manifest regardless.
 *
 * No credit debit. Capture is intake, not generation. AI modules
 * (which DO debit) run via Trigger.dev tasks; this is a direct
 * route.
 *
 * Auth: Clerk-required. Project ownership enforced via
 * `getProject(id, userId)` — a user cannot register screenshots on
 * another user's project even if they guess the projectId.
 */

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/clerk";
import { getProject } from "@/lib/db/queries/projects";
import { registerScreenshots } from "@/lib/db/queries/screenshots";
import { apiLimiter, limit } from "@/lib/utils/ratelimit";
import { logError } from "@/lib/observability/log";
import { RegisterBodySchema } from "./schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  let user;
  try {
    user = await requireUser();
  } catch {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  const rl = await limit(apiLimiter, user.id);
  if (!rl.success) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  const parsed = RegisterBodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "invalid_body", issues: parsed.error.format() },
      { status: 400 },
    );
  }

  // ── Project ownership ─────────────────────────────────────────────────────
  const project = await getProject(parsed.data.projectId, user.id);
  if (!project) {
    return Response.json({ ok: false, error: "project_not_found" }, { status: 404 });
  }

  // ── Key-prefix sanity ─────────────────────────────────────────────────────
  // Every r2Key the client sends must live under the user's namespace.
  // Belt-and-braces against a malicious client trying to register
  // someone else's uploaded key onto its own project.
  const expectedPrefix = `users/${user.id}/`;
  for (const item of parsed.data.items) {
    if (!item.r2Key.startsWith(expectedPrefix)) {
      return Response.json(
        { ok: false, error: "invalid_r2_key" },
        { status: 400 },
      );
    }
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  try {
    const result = await registerScreenshots(
      parsed.data.projectId,
      parsed.data.items.map((i) => ({
        device: i.device,
        r2Key:  i.r2Key,
        width:  i.width,
        height: i.height,
        locale: i.locale,
      })),
    );
    return Response.json({
      ok: true,
      data: {
        ids:      result.ids,
        inserted: result.inserted,
        skipped:  result.skipped,
      },
    }, { status: 201 });
  } catch (err) {
    logError("[screenshots.register] insert failed", err, {
      userId:    user.id,
      projectId: parsed.data.projectId,
      count:     parsed.data.items.length,
    });
    return Response.json({ ok: false, error: "register_failed" }, { status: 500 });
  }
}
