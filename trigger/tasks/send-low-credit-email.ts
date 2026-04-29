import { task } from "@trigger.dev/sdk/v3";
import { loopsTrigger } from "@/lib/email/loops";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Payload = { userId: string; balance: number };

export const sendLowCreditEmail = task({
  id: "send-low-credit-email",
  maxDuration: 30,
  run: async (payload: Payload) => {
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
    if (!user) return { ok: false as const, reason: "user_not_found" };
    await loopsTrigger("low_credit_threshold", user.email, { balance: payload.balance });
    return { ok: true as const };
  },
});
