import { NextRequest } from "next/server";
import { z } from "zod";
import { tasks } from "@trigger.dev/sdk/v3";
import { nanoid } from "nanoid";
import { requireUser } from "@/lib/auth/clerk";
import { isStudioOrLifetime } from "@/lib/auth/permissions";
import { getBalance } from "@/lib/db/queries/credits";
import { aiLimiter, limit } from "@/lib/utils/ratelimit";
import { CREDIT_COST } from "@/lib/utils/credits";

export const runtime = "nodejs";

const Body = z.object({
  projectId: z.string().uuid(),
  source: z.string().min(1),
  fromLocale: z.string().default("en"),
  toLocales: z.array(z.string()).min(1).max(41),
  context: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch { return Response.json({ ok: false, error: "unauthorized" }, { status: 401 }); }

  const rl = await limit(aiLimiter, user.id);
  if (!rl.success) return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });

  const cost = CREDIT_COST.ai_translate * parsed.data.toLocales.length;
  const balance = await getBalance(user.id);
  if (!isStudioOrLifetime(user) && balance < cost) {
    return Response.json({ ok: false, error: "insufficient_credits", required: cost }, { status: 402 });
  }

  const idempotencyKey = `translate:${nanoid()}`;
  const handle = await tasks.trigger("batch-translate", {
    ...parsed.data,
    userId: user.id,
    idempotencyKey,
    stripeCustomerId: user.stripeCustomerId ?? null,
    isUnmetered: isStudioOrLifetime(user),
  });
  return Response.json({ ok: true, data: { runId: handle.id, locales: parsed.data.toLocales.length, cost } });
}
