/**
 * POST /api/projects — create a project.
 *
 * Authenticated users only. Validates input with Zod against the same
 * shape as the new-project wizard, persists via Drizzle, and returns
 * `{ ok: true, data: { id } }` so the client can `router.push` straight
 * into the editor.
 *
 * Rate-limited via the generic `apiLimiter` (120 req/min/user). The
 * limiter falls open if Upstash isn't configured (dev convenience).
 *
 * Idempotency: not implemented yet — duplicate clicks create duplicate
 * projects. The wizard's submit button disables itself while pending,
 * so the client side covers the common case. Server-side idempotency
 * via a header-supplied key is a follow-up if we see noise in logs.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/clerk";
import { createProject } from "@/lib/db/queries/projects";
import { apiLimiter, limit } from "@/lib/utils/ratelimit";
import { DEVICES_BY_ID } from "@/lib/devices/catalog";
import { logError } from "@/lib/observability/log";

export const runtime = "nodejs";

const Body = z.object({
  name:           z.string().trim().min(1, "Name is required").max(120),
  appName:        z.string().trim().min(1, "App name is required").max(80),
  appDescription: z.string().trim().max(600).optional().default(""),
  category:       z.string().trim().max(60).optional().default(""),
  storeTargets:   z
    .array(z.string())
    .min(1, "Pick at least one device")
    .max(40)
    .refine(
      (ids) => ids.every((id) => id in DEVICES_BY_ID),
      { message: "Unknown device id" },
    ),
});

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
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "invalid_body", issues: parsed.error.format() },
      { status: 400 },
    );
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  try {
    const project = await createProject({
      userId:         user.id,
      name:           parsed.data.name,
      appName:        parsed.data.appName,
      appDescription: parsed.data.appDescription,
      category:       parsed.data.category,
      storeTargets:   parsed.data.storeTargets,
    });
    return Response.json({ ok: true, data: { id: project.id } }, { status: 201 });
  } catch (err) {
    logError("[projects.create] insert failed", err, { userId: user.id });
    return Response.json({ ok: false, error: "create_failed" }, { status: 500 });
  }
}
