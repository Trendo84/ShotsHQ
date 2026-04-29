import { NextRequest } from "next/server";
import { z } from "zod";
import { tasks } from "@trigger.dev/sdk/v3";
import { nanoid } from "nanoid";
import { requireUser } from "@/lib/auth/clerk";

export const runtime = "nodejs";

const Body = z.object({
  projectId: z.string().uuid(),
  device: z.enum(["iphone_69", "iphone_67", "ipad_13"]),
  locale: z.string().default("en"),
});

/**
 * Server-side render dispatch. Standard exports are free; for AI-composited
 * exports the relevant AI charge has already been ledger'd before this hits.
 */
export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch { return Response.json({ ok: false, error: "unauthorized" }, { status: 401 }); }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });

  const handle = await tasks.trigger("render-screenshot", {
    ...parsed.data,
    userId: user.id,
    idempotencyKey: `render:${nanoid()}`,
  });
  return Response.json({ ok: true, data: { runId: handle.id } });
}
