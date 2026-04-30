import { NextRequest } from "next/server";
import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { logError } from "@/lib/observability/log";

export const runtime = "nodejs";

type ClerkEvent = {
  type: "user.created" | "user.updated" | "user.deleted";
  data: { id: string; email_addresses?: { email_address: string }[] };
};

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return new Response("missing secret", { status: 500 });

  const id        = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const sig       = req.headers.get("svix-signature");
  if (!id || !timestamp || !sig) return new Response("missing headers", { status: 400 });

  const raw = await req.text();
  let event: ClerkEvent;
  try {
    // svix is provided transitively by @clerk/nextjs.
    event = new Webhook(secret).verify(raw, { "svix-id": id, "svix-timestamp": timestamp, "svix-signature": sig }) as ClerkEvent;
  } catch (err) {
    logError("[clerk.webhook] verify failed", err);
    return new Response("invalid signature", { status: 400 });
  }

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const email = event.data.email_addresses?.[0]?.email_address ?? "";
      const [existing] = await db.select().from(users).where(eq(users.clerkId, event.data.id));
      if (!existing) {
        await db.insert(users).values({ clerkId: event.data.id, email });
      } else if (existing.email !== email) {
        await db.update(users).set({ email, updatedAt: new Date() }).where(eq(users.id, existing.id));
      }
    } else if (event.type === "user.deleted") {
      // Cascade-deletes projects, screenshots, ledger via FK on delete cascade.
      await db.delete(users).where(eq(users.clerkId, event.data.id));
    }
    return Response.json({ ok: true });
  } catch (err) {
    logError("[clerk.webhook] handler failed", err, { type: event.type });
    return new Response("handler failed", { status: 500 });
  }
}
