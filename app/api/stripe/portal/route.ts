import { requireUser } from "@/lib/auth/clerk";
import { createPortalSession } from "@/lib/stripe/checkout";

export const runtime = "nodejs";

export async function POST() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!user.stripeCustomerId) {
    return Response.json({ ok: false, error: "no_stripe_customer" }, { status: 400 });
  }
  const session = await createPortalSession(user.stripeCustomerId);
  return Response.json({ ok: true, data: { url: session.url } });
}
