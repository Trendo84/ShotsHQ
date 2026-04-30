import { task } from "@trigger.dev/sdk/v3";
import { nanoid } from "nanoid";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { creditCredits, debitCredits } from "@/lib/db/queries/credits";
import { fireMeterEvent } from "@/lib/stripe/meters";
import { CREDIT_COST } from "@/lib/utils/credits";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/storage/r2";
import { generateImage } from "@/lib/ai/openai-image";
import {
  buildTemplateSetPrompt,
  type TemplateSetStyle,
} from "@/lib/ai/prompts/template-set";

/**
 * `ai-template-set` — generate a cohesive 6-up App Store screenshot
 * composition via gpt-image-1, then store the PNG in R2.
 *
 * Migrated out of the route handler so the credit debit + AI call +
 * R2 upload + meter event live inside a single transaction boundary
 * with retry semantics. The route handler used to violate the locked
 * CLAUDE.md invariant ("don't debit credits in a route that calls
 * OpenAI directly") because a Vercel cold-restart between debit and
 * generation could leave the user double-billed.
 *
 * Failure modes:
 *   - gpt-image-1 throws → refund the debit, rethrow so Trigger.dev
 *     marks the run failed and the client surfaces an error.
 *   - R2 upload throws → also refund (user can't access the result
 *     they paid for), rethrow.
 *   - Trigger.dev's own retry policy (configured in trigger.config.ts:
 *     3 attempts with exponential backoff) covers transient failures
 *     before the refund-on-failure logic kicks in.
 */
type Payload = {
  userId:           string;
  projectId:        string | null;
  appName:          string;
  appDescription:   string;
  category:         string;
  style:            TemplateSetStyle;
  primaryColor?:    string;
  accentColor?:     string;
  voice?:           string;
  device:           "iphone" | "ipad";
  idempotencyKey:   string;
  stripeCustomerId: string | null;
  isUnmetered:      boolean;
};

export const aiTemplateSet = task({
  id: "ai-template-set",
  maxDuration: 240,
  run: async (payload: Payload) => {
    // ── 1. Debit credits (idempotent) ───────────────────────────────────────
    const cost = CREDIT_COST.ai_template_set;
    const debit = await debitCredits({
      userId:         payload.userId,
      amount:         cost,
      // closest existing enum — tier tracked in metadata downstream
      reason:         "ai_background",
      refId:          payload.idempotencyKey,
      idempotencyKey: payload.idempotencyKey,
    });
    if (!debit.ok) throw new Error(debit.reason);

    // ── 2. Generate the image ──────────────────────────────────────────────
    let buffer: Buffer;
    let revisedPrompt: string | null = null;
    try {
      const prompt = buildTemplateSetPrompt({
        appName:        payload.appName,
        appDescription: payload.appDescription,
        category:       payload.category,
        style:          payload.style,
        primaryColor:   payload.primaryColor,
        accentColor:    payload.accentColor,
        voice:          payload.voice,
        device:         payload.device,
      });

      const result = await generateImage({
        prompt,
        size:    "1536x1024", // wide — fits 6 frames horizontally
        quality: "high",
      });
      buffer        = result.buffer;
      revisedPrompt = result.revisedPrompt;
    } catch (err) {
      await creditCredits({
        userId:         payload.userId,
        amount:         cost,
        reason:         "refund",
        refId:          payload.idempotencyKey,
        idempotencyKey: `${payload.idempotencyKey}:refund`,
        metadata:       { op: "ai_template_set", error: String(err).slice(0, 500) },
      });
      throw err;
    }

    // ── 3. Upload to R2 ────────────────────────────────────────────────────
    const key = payload.projectId
      ? `users/${payload.userId}/projects/${payload.projectId}/templates/${nanoid()}.png`
      : `users/${payload.userId}/templates/${nanoid()}.png`;

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
      await creditCredits({
        userId:         payload.userId,
        amount:         cost,
        reason:         "refund",
        refId:          payload.idempotencyKey,
        idempotencyKey: `${payload.idempotencyKey}:refund`,
        metadata:       { op: "ai_template_set", error: "r2_upload_failed" },
      });
      throw err;
    }

    // ── 4. Stripe meter event (only for paying customers) ──────────────────
    if (payload.stripeCustomerId) {
      await fireMeterEvent(
        "ai_generation",
        payload.stripeCustomerId,
        payload.idempotencyKey,
      );
    }

    return {
      ok:            true as const,
      url:           `${R2_PUBLIC_URL}/${key}`,
      key,
      revisedPrompt,
      cost,
      newBalance:    debit.newBalance,
    };
  },
});
