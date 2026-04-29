import { task } from "@trigger.dev/sdk/v3";
import { creditCredits, debitCredits } from "@/lib/db/queries/credits";
import { falFlux } from "@/lib/ai/restyle";
import { fireMeterEvent } from "@/lib/stripe/meters";
import { CREDIT_COST } from "@/lib/utils/credits";
import { STORE_DIMENSIONS } from "@/lib/utils/store-dimensions";

type Payload = {
  userId: string;
  projectId: string;
  referenceUrl: string;
  prompt: string;
  device: keyof typeof STORE_DIMENSIONS;
  idempotencyKey: string;
  stripeCustomerId: string | null;
  isUnmetered: boolean;
};

export const aiRestyle = task({
  id: "ai-restyle",
  maxDuration: 240,
  run: async (payload: Payload) => {
    const debit = await debitCredits({
      userId:         payload.userId,
      amount:         CREDIT_COST.ai_restyle,
      reason:         "ai_restyle",
      refId:          payload.idempotencyKey,
      idempotencyKey: payload.idempotencyKey,
    });
    if (!debit.ok) throw new Error(debit.reason);

    try {
      const dim = STORE_DIMENSIONS[payload.device];
      const result = await falFlux({
        prompt:    payload.prompt,
        imageUrl:  payload.referenceUrl,
        width:     dim.width,
        height:    dim.height,
      });
      if (payload.stripeCustomerId) {
        await fireMeterEvent("ai_generation", payload.stripeCustomerId, payload.idempotencyKey);
      }
      return { ok: true as const, images: result.images };
    } catch (err) {
      await creditCredits({
        userId:         payload.userId,
        amount:         CREDIT_COST.ai_restyle,
        reason:         "refund",
        refId:          payload.idempotencyKey,
        idempotencyKey: `${payload.idempotencyKey}:refund`,
      });
      throw err;
    }
  },
});
