/**
 * POST /api/ai/template-set
 *
 * Dispatches a Trigger.dev `ai-template-set` task that generates a
 * cohesive 6-up App Store screenshot composition via gpt-image-1, then
 * stores the PNG in R2.
 *
 * The route handler does NOT debit credits or call OpenAI directly —
 * that's the task's job. This keeps the credit ledger transaction
 * boundary atomic and lets Trigger.dev's retry policy catch transient
 * failures before the refund-on-failure path kicks in.
 *
 * Returns `{ ok: true, data: { runId } }` so the client can stream
 * progress via `useRealtimeRun(runId)` from `@trigger.dev/react-hooks`.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { tasks } from "@trigger.dev/sdk/v3";
import { nanoid } from "nanoid";

import { requireUser } from "@/lib/auth/clerk";
import { isStudioOrLifetime } from "@/lib/auth/permissions";
import { getBalance } from "@/lib/db/queries/credits";
import { aiLimiter, limit } from "@/lib/utils/ratelimit";
import { CREDIT_COST } from "@/lib/utils/credits";
import { logError } from "@/lib/observability/log";
import type { TemplateSetStyle } from "@/lib/ai/prompts/template-set";

export const runtime = "nodejs";

const Body = z.object({
  projectId:      z.string().uuid().optional(),
  appName:        z.string().min(1).max(60),
  appDescription: z.string().min(10).max(600),
  category:       z.string().min(1).max(40),
  style:          z.enum([
    "minimal-light",
    "tactical-dark",
    "warm-organic",
    "playful-gradient",
    "tech-minimal",
    "editorial",
  ]) satisfies z.ZodType<TemplateSetStyle>,
  primaryColor:   z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor:    z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  voice:          z.string().max(160).optional(),
  device:         z.enum(["iphone", "ipad"]).optional(),
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
  const rl = await limit(aiLimiter, user.id);
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

  // ── Pre-flight balance check (debit happens inside the task) ─────────────
  const balance = await getBalance(user.id);
  const cost    = CREDIT_COST.ai_template_set;
  if (!isStudioOrLifetime(user) && balance < cost) {
    return Response.json(
      { ok: false, error: "insufficient_credits", needed: cost, have: balance },
      { status: 402 },
    );
  }

  // ── Dispatch ──────────────────────────────────────────────────────────────
  const idempotencyKey = `template_set:${nanoid()}`;

  try {
    const handle = await tasks.trigger("ai-template-set", {
      userId:           user.id,
      projectId:        parsed.data.projectId ?? null,
      appName:          parsed.data.appName,
      appDescription:   parsed.data.appDescription,
      category:         parsed.data.category,
      style:            parsed.data.style,
      primaryColor:     parsed.data.primaryColor,
      accentColor:      parsed.data.accentColor,
      voice:            parsed.data.voice,
      device:           parsed.data.device ?? "iphone",
      idempotencyKey,
      stripeCustomerId: user.stripeCustomerId ?? null,
      isUnmetered:      isStudioOrLifetime(user),
    });
    return Response.json({ ok: true, data: { runId: handle.id, idempotencyKey } });
  } catch (err) {
    logError("[ai.template-set] dispatch failed", err, { userId: user.id });
    return Response.json({ ok: false, error: "dispatch_failed" }, { status: 500 });
  }
}
