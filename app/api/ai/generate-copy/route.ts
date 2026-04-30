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

export const runtime = "nodejs";

const Body = z.object({
  projectId: z.string().uuid(),
  appName: z.string().min(1),
  appDescription: z.string().min(1),
  category: z.string().min(1),
  locale: z.string().default("en"),
});

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const rl = await limit(aiLimiter, user.id);
  if (!rl.success) return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });

  // Pre-flight balance check (debit happens inside the trigger task).
  const balance = await getBalance(user.id);
  if (!isStudioOrLifetime(user) && balance < CREDIT_COST.ai_copy) {
    return Response.json({ ok: false, error: "insufficient_credits" }, { status: 402 });
  }

  const idempotencyKey = `copy:${nanoid()}`;

  try {
    const handle = await tasks.trigger("ai-generate-copy", {
      ...parsed.data,
      userId: user.id,
      idempotencyKey,
      stripeCustomerId: user.stripeCustomerId ?? null,
      isUnmetered: isStudioOrLifetime(user),
    });
    return Response.json({ ok: true, data: { runId: handle.id } });
  } catch (err) {
    logError("[ai.generate-copy] dispatch failed", err, { userId: user.id });
    return Response.json({ ok: false, error: "dispatch_failed" }, { status: 500 });
  }
}
