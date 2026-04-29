import { batch, task } from "@trigger.dev/sdk/v3";
import { creditCredits, debitCredits } from "@/lib/db/queries/credits";
import { translateString } from "@/lib/ai/translate";
import { fireMeterEvent } from "@/lib/stripe/meters";
import { CREDIT_COST } from "@/lib/utils/credits";

type Payload = {
  userId: string;
  projectId: string;
  source: string;
  fromLocale: string;
  toLocales: string[];
  context: string;
  idempotencyKey: string;
  stripeCustomerId: string | null;
  isUnmetered: boolean;
};

/** Single-locale child task. */
export const translateOne = task({
  id: "translate-one",
  maxDuration: 60,
  run: async (input: { source: string; fromLocale: string; toLocale: string; context: string }) => {
    const text = await translateString(input);
    return { locale: input.toLocale, text };
  },
});

/** Parent task — fans out one child per locale, refunds on partial failure. */
export const batchTranslate = task({
  id: "batch-translate",
  maxDuration: 600,
  run: async (payload: Payload) => {
    const cost = CREDIT_COST.ai_translate * payload.toLocales.length;
    const debit = await debitCredits({
      userId:         payload.userId,
      amount:         cost,
      reason:         "ai_translate",
      refId:          payload.idempotencyKey,
      idempotencyKey: payload.idempotencyKey,
    });
    if (!debit.ok) throw new Error(debit.reason);

    try {
      const runs = await batch.triggerAndWait<typeof translateOne>(
        payload.toLocales.map((toLocale) => ({
          id: "translate-one",
          payload: {
            source:     payload.source,
            fromLocale: payload.fromLocale,
            toLocale,
            context:    payload.context,
          },
        })),
      );

      const results: Record<string, string> = {};
      let failures = 0;
      for (const r of runs.runs) {
        if (r.ok && r.output) results[r.output.locale] = r.output.text;
        else failures++;
      }

      if (failures > 0) {
        // Refund the proportional amount that didn't complete.
        await creditCredits({
          userId:         payload.userId,
          amount:         CREDIT_COST.ai_translate * failures,
          reason:         "refund",
          refId:          payload.idempotencyKey,
          idempotencyKey: `${payload.idempotencyKey}:refund:${failures}`,
        });
      }

      if (payload.stripeCustomerId) {
        await fireMeterEvent("ai_generation", payload.stripeCustomerId, payload.idempotencyKey, payload.toLocales.length - failures);
      }

      return { ok: true as const, results, failures };
    } catch (err) {
      await creditCredits({
        userId:         payload.userId,
        amount:         cost,
        reason:         "refund",
        refId:          payload.idempotencyKey,
        idempotencyKey: `${payload.idempotencyKey}:refund:all`,
      });
      throw err;
    }
  },
});
