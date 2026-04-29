import { eq, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { creditLedger, users } from "@/lib/db/schema";

export type DebitParams = {
  userId: string;
  amount: number;
  reason: "ai_copy" | "ai_background" | "ai_restyle" | "ai_translate";
  refId: string;
  idempotencyKey: string;
};

export type CreditParams = {
  userId: string;
  amount: number;
  reason: "purchase" | "refund" | "lifetime_grant" | "monthly_reset";
  refId: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type DebitResult =
  | { ok: true;  newBalance: number }
  | { ok: false; reason: "insufficient" | "not_found" };

const UNMETERED_PLANS = new Set(["studio_monthly", "studio_annual", "lifetime"]);

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: string }).code;
  return code === "23505";
}

/** Either the top-level db handle or a transaction handle — we only need
 *  the common `select().from().where()` surface, which both expose. */
type DbOrTx =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Sum the ledger inside a transaction. Always source-of-truth. */
async function sumLedger(tx: DbOrTx, userId: string): Promise<number> {
  const [row] = await tx
    .select({ total: sum(creditLedger.delta) })
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId));
  return Number(row?.total ?? 0);
}

/**
 * Atomically debit credits before an AI call.
 * Idempotent via the unique constraint on `idempotency_key`.
 */
export async function debitCredits(params: DebitParams): Promise<DebitResult> {
  return await db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, params.userId));
    if (!user) return { ok: false, reason: "not_found" } as const;

    const balance = await sumLedger(tx, params.userId);

    if (UNMETERED_PLANS.has(user.plan)) {
      try {
        await tx.insert(creditLedger).values({
          userId:         params.userId,
          delta:          0,
          reason:         params.reason,
          refId:          params.refId,
          idempotencyKey: params.idempotencyKey,
        });
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
      }
      return { ok: true, newBalance: Number.POSITIVE_INFINITY } as const;
    }

    if (balance < params.amount) return { ok: false, reason: "insufficient" } as const;

    try {
      await tx.insert(creditLedger).values({
        userId:         params.userId,
        delta:          -params.amount,
        reason:         params.reason,
        refId:          params.refId,
        idempotencyKey: params.idempotencyKey,
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        return { ok: true, newBalance: balance } as const;
      }
      throw err;
    }

    await tx
      .update(users)
      .set({ creditBalance: balance - params.amount, updatedAt: new Date() })
      .where(eq(users.id, params.userId));

    return { ok: true, newBalance: balance - params.amount } as const;
  });
}

/**
 * Add credits (purchase, refund, monthly reset, lifetime grant).
 * Idempotent via unique idempotency_key.
 */
export async function creditCredits(params: CreditParams): Promise<{ ok: true; newBalance: number }> {
  return await db.transaction(async (tx) => {
    const balance = await sumLedger(tx, params.userId);
    try {
      await tx.insert(creditLedger).values({
        userId:         params.userId,
        delta:          params.amount,
        reason:         params.reason,
        refId:          params.refId,
        idempotencyKey: params.idempotencyKey,
        metadata:       params.metadata ?? null,
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        return { ok: true, newBalance: balance } as const;
      }
      throw err;
    }

    await tx
      .update(users)
      .set({ creditBalance: balance + params.amount, updatedAt: new Date() })
      .where(eq(users.id, params.userId));

    return { ok: true, newBalance: balance + params.amount } as const;
  });
}

/** Read the canonical balance from the ledger. */
export async function getBalance(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sum(creditLedger.delta) })
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId));
  return Number(row?.total ?? 0);
}
