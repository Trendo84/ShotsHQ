import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

/** Resolve the authenticated Clerk user id (server-only). */
export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

/**
 * Resolve the local Postgres user record for the current Clerk session,
 * creating it on the fly if necessary. Idempotent by clerkId.
 */
export async function getOrCreateDbUser(): Promise<User | null> {
  const clerkUser = await clerkCurrentUser();
  if (!clerkUser) return null;

  const [existing] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
  if (existing) return existing;

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const [created] = await db
    .insert(users)
    .values({ clerkId: clerkUser.id, email })
    .returning();
  if (!created) throw new Error("failed to create local user record");
  return created;
}

/** Convenience: assert a user is authenticated, return their db record. */
export async function requireUser(): Promise<User> {
  const user = await getOrCreateDbUser();
  if (!user) throw new Error("unauthorized");
  return user;
}
