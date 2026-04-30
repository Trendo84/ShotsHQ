import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe/client";
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleInvoicePaid,
} from "@/lib/stripe/webhook-handlers";
import { logError } from "@/lib/observability/log";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return new Response("missing signature", { status: 400 });
  }

  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    logError("[stripe.webhook] verify failed", err);
    return new Response("invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionUpdated(event);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaid(event);
        break;
      default:
        // Acknowledge but ignore.
        break;
    }
    return Response.json({ ok: true, received: event.type });
  } catch (err) {
    logError("[stripe.webhook] handler failed", err, { type: event.type });
    // Return 500 so Stripe retries. Handlers are idempotent.
    return new Response("handler failed", { status: 500 });
  }
}
