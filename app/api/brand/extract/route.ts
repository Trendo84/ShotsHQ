/**
 * POST /api/brand/extract
 *
 * Body:  { url: string }
 * Reply: { ok: true, data: BrandProfile } | { ok: false, error }
 *
 * Extracts a brand profile from a public URL. Costs ~$0.005-0.01 in
 * gpt-5 tokens (~free at our scale), so we rate-limit but don't debit
 * credits. Used to pre-fill new projects with brand-perfect defaults.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/clerk";
import { aiLimiter, limit } from "@/lib/utils/ratelimit";
import { extractBrand } from "@/lib/brand/extract";

export const runtime     = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  url: z.string().url().max(500),
});

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const rl = await limit(aiLimiter, user.id);
  if (!rl.success) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  try {
    const profile = await extractBrand(parsed.data.url);
    return Response.json({ ok: true, data: profile });
  } catch (err) {
    console.error("[brand.extract] failed", err);
    const message = err instanceof Error ? err.message : "extraction_failed";
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}
