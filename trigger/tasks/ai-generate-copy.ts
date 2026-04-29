import { task } from "@trigger.dev/sdk/v3";
import { generateHeadline } from "@/lib/ai/copy";
import { creditCredits, debitCredits } from "@/lib/db/queries/credits";
import { fireMeterEvent } from "@/lib/stripe/meters";
import { CREDIT_COST } from "@/lib/utils/credits";

type Payload = {
  userId: string;
  projectId: string;
  appName: string;
  appDescription: string;
  category: string;
  locale: string;
  idempotencyKey: string;
  stripeCustomerId: string | null;
  isUnmetered: boolean;
};

export const aiGenerateCopy = task({
  id: "ai-generate-copy",
  maxDuration: 60,
  run: async (payload: Payload) => {
    const debit = await debitCredits({
      userId:         payload.userId,
      amount:         CREDIT_COST.ai_copy,
      reason:         "ai_copy",
      refId:          payload.idempotencyKey,
      idempotencyKey: payload.idempotencyKey,
    });
    if (!debit.ok) throw new Error(debit.reason);

    try {
      const headline = await generateHeadline({
        appName:        payload.appName,
        appDescription: payload.appDescription,
        category:       payload.category,
        locale:         payload.locale,
      });

      if (payload.stripeCustomerId) {
        await fireMeterEvent("ai_generation", payload.stripeCustomerId, payload.idempotencyKey);
      }
      return { ok: true as const, headline };
    } catch (err) {
      // Refund on failure.
      await creditCredits({
        userId:         payload.userId,
        amount:         CREDIT_COST.ai_copy,
        reason:         "refund",
        refId:          payload.idempotencyKey,
        idempotencyKey: `${payload.idempotencyKey}:refund`,
      });
      throw err;
    }
  },
});
