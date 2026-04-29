/**
 * POST /api/ai/template-set
 *
 * Generates a cohesive 6-up App Store screenshot composition via
 * gpt-image-1 in a SINGLE call. Costs 8 credits (premium tier).
 *
 * Flow:
 *   1. Auth + balance check
 *   2. Debit credits (idempotent)
 *   3. Call gpt-image-1 with the master template-set prompt
 *   4. Upload result to R2 under users/{userId}/templates/{nanoid}.png
 *   5. Return { url, key, revisedPrompt }
 *   6. On any failure after debit → refund credits
 *
 * Note: Synchronous call, not via Trigger.dev. gpt-image-1 finishes in
 * 15-30s which fits within Vercel's serverless limits. Move to Trigger
 * if we need >60s reliability.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { requireUser } from "@/lib/auth/clerk";
import { isStudioOrLifetime } from "@/lib/auth/permissions";
import { debitCredits, creditCredits, getBalance } from "@/lib/db/queries/credits";
import { aiLimiter, limit } from "@/lib/utils/ratelimit";
import { CREDIT_COST } from "@/lib/utils/credits";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/storage/r2";
import { generateImage } from "@/lib/ai/openai-image";
import {
  buildTemplateSetPrompt,
  type TemplateSetStyle,
} from "@/lib/ai/prompts/template-set";

export const runtime     = "nodejs";
export const maxDuration = 60; // Vercel: extend if you have Pro

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
    return Response.json({ ok: false, error: "invalid_body", issues: parsed.error.format() }, { status: 400 });
  }

  // ── Balance pre-check ─────────────────────────────────────────────────────
  const balance = await getBalance(user.id);
  const cost    = CREDIT_COST.ai_template_set;
  if (!isStudioOrLifetime(user) && balance < cost) {
    return Response.json({ ok: false, error: "insufficient_credits", needed: cost, have: balance }, { status: 402 });
  }

  // ── Debit (idempotent) ────────────────────────────────────────────────────
  const idempotencyKey = `template_set:${nanoid()}`;
  const debit = await debitCredits({
    userId:         user.id,
    amount:         cost,
    reason:         "ai_background", // closest existing enum; tier tracked in metadata downstream
    refId:          idempotencyKey,
    idempotencyKey,
  });
  if (!debit.ok) {
    return Response.json({ ok: false, error: debit.reason }, { status: 402 });
  }

  // ── Generate via gpt-image-1 ──────────────────────────────────────────────
  let buffer: Buffer;
  let revisedPrompt: string | null = null;
  try {
    const prompt = buildTemplateSetPrompt({
      appName:        parsed.data.appName,
      appDescription: parsed.data.appDescription,
      category:       parsed.data.category,
      style:          parsed.data.style,
      primaryColor:   parsed.data.primaryColor,
      accentColor:    parsed.data.accentColor,
      voice:          parsed.data.voice,
      device:         parsed.data.device ?? "iphone",
    });

    const result = await generateImage({
      prompt,
      size:    "1536x1024", // wide — fits 6 frames horizontally
      quality: "high",
    });
    buffer        = result.buffer;
    revisedPrompt = result.revisedPrompt;
  } catch (err) {
    // Refund on AI failure
    await creditCredits({
      userId:         user.id,
      amount:         cost,
      reason:         "refund",
      refId:          idempotencyKey,
      idempotencyKey: `${idempotencyKey}:refund`,
      metadata:       { op: "ai_template_set", error: String(err).slice(0, 500) },
    });
    console.error("[ai.template-set] gpt-image-1 failed", err);
    return Response.json({ ok: false, error: "generation_failed" }, { status: 502 });
  }

  // ── Upload to R2 ──────────────────────────────────────────────────────────
  const key = parsed.data.projectId
    ? `users/${user.id}/projects/${parsed.data.projectId}/templates/${nanoid()}.png`
    : `users/${user.id}/templates/${nanoid()}.png`;

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket:       R2_BUCKET,
        Key:          key,
        Body:         buffer,
        ContentType:  "image/png",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  } catch (err) {
    // Refund on storage failure too — user shouldn't pay for a result they can't access.
    await creditCredits({
      userId:         user.id,
      amount:         cost,
      reason:         "refund",
      refId:          idempotencyKey,
      idempotencyKey: `${idempotencyKey}:refund`,
      metadata:       { op: "ai_template_set", error: "r2_upload_failed" },
    });
    console.error("[ai.template-set] R2 upload failed", err);
    return Response.json({ ok: false, error: "storage_failed" }, { status: 502 });
  }

  return Response.json({
    ok:   true,
    data: {
      url:           `${R2_PUBLIC_URL}/${key}`,
      key,
      revisedPrompt,
      cost,
      newBalance:    debit.newBalance,
    },
  });
}
