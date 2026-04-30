import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/clerk";
import { createCheckoutSession, type CheckoutPlan } from "@/lib/stripe/checkout";
import { logError } from "@/lib/observability/log";

export const runtime = "nodejs";

const Body = z.object({
  plan: z.enum(["indie", "pro", "studio_monthly", "studio_annual", "lifetime"]),
});

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });

  try {
    const session = await createCheckoutSession({
      plan: parsed.data.plan as CheckoutPlan,
      userId: user.id,
      customerId: user.stripeCustomerId,
      email: user.email,
    });
    return Response.json({ ok: true, data: { url: session.url } });
  } catch (err) {
    logError("[stripe.checkout] failed", err, { userId: user.id, plan: parsed.data.plan });
    return Response.json({ ok: false, error: "checkout_failed" }, { status: 500 });
  }
}
