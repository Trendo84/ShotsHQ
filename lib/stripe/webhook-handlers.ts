import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { creditCredits } from "@/lib/db/queries/credits";
import { createCreditGrant } from "@/lib/stripe/credits";

const PACK_CREDITS: Record<string, number> = {
  indie:    100,
  pro:      300,
  lifetime: 9999, // sentinel — unmetered tier still gets a numeric grant
};

const PACK_AMOUNT_CENTS: Record<string, number> = {
  indie:    1900,
  pro:      4900,
  lifetime: 14900,
};

const PLAN_BY_CHECKOUT: Record<string, "studio_monthly" | "studio_annual" | "lifetime"> = {
  studio_monthly: "studio_monthly",
  studio_annual:  "studio_annual",
  lifetime:       "lifetime",
};

/**
 * Handle a successfully completed checkout session.
 * For credit packs: insert ledger row + create matching Stripe credit grant.
 * For Studio subs / lifetime: flip the plan flag, ledger only marks the start.
 */
export async function handleCheckoutCompleted(event: Stripe.CheckoutSessionCompletedEvent) {
  const session = event.data.object;
  const userId  = session.metadata?.userId;
  const plan    = session.metadata?.plan;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!userId || !plan) {
    console.warn("[stripe.webhook] checkout.session.completed missing metadata", { sessionId: session.id });
    return;
  }

  // Persist Stripe customer id on user record (idempotent).
  if (customerId) {
    await db.update(users).set({ stripeCustomerId: customerId, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  if (plan in PACK_CREDITS && customerId) {
    await createCreditGrant({ customerId, amountCents: PACK_AMOUNT_CENTS[plan] ?? 0 });
    await creditCredits({
      userId,
      amount: PACK_CREDITS[plan]!,
      reason: "purchase",
      refId:  typeof session.payment_intent === "string" ? session.payment_intent : session.id,
      idempotencyKey: `purchase:${session.id}`,
      metadata: { plan, sessionId: session.id },
    });
    return;
  }

  if (PLAN_BY_CHECKOUT[plan]) {
    const newPlan = PLAN_BY_CHECKOUT[plan]!;
    await db.update(users).set({ plan: newPlan, updatedAt: new Date() }).where(eq(users.id, userId));
    if (newPlan === "lifetime") {
      await creditCredits({
        userId,
        amount: 0,
        reason: "lifetime_grant",
        refId:  session.id,
        idempotencyKey: `lifetime:${session.id}`,
        metadata: { sessionId: session.id },
      });
    }
  }
}

export async function handleSubscriptionUpdated(
  event:
    | Stripe.CustomerSubscriptionCreatedEvent
    | Stripe.CustomerSubscriptionUpdatedEvent
    | Stripe.CustomerSubscriptionDeletedEvent,
) {
  const sub = event.data.object;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
  if (!user) return;

  if (sub.status === "active" || sub.status === "trialing") {
    // Plan id mapping is left to caller config — read from sub.items.data[0].price.id.
    return;
  }

  if (sub.status === "canceled" || sub.status === "unpaid") {
    await db.update(users).set({ plan: "free", updatedAt: new Date() }).where(eq(users.id, user.id));
  }
}

export async function handleInvoicePaid(event: Stripe.InvoicePaymentSucceededEvent) {
  const invoice = event.data.object;
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;
  const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
  if (!user) return;

  await creditCredits({
    userId: user.id,
    amount: 0,
    reason: "monthly_reset",
    refId:  invoice.id ?? "",
    idempotencyKey: `invoice:${invoice.id}`,
    metadata: { invoiceId: invoice.id },
  });
}
