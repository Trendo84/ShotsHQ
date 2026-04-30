import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

/**
 * E2E auth bypass — see `docs/issues/v1.1-playwright-auth-bypass.md`.
 * Two gates, both required: NODE_ENV !== "production" AND
 * NEXT_PUBLIC_E2E === "1". Hard build guard in next.config.ts blocks
 * production deploys with the flag set as belt-and-suspenders.
 */
const IS_E2E_BYPASS =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_E2E === "1";

const E2E_FIXTURE = {
  id:      "00000000-0000-0000-0000-000000000001",
  clerkId: "e2e-smoke",
  email:   "e2e-smoke@shotshq.local",
} as const;

let _e2eWarned = false;
function warnE2EOnce() {
  if (_e2eWarned) return;
  _e2eWarned = true;
  // eslint-disable-next-line no-console
  console.warn(
    "\n\x1b[33m⚠ [auth] E2E bypass active — using synthetic user " +
      `${E2E_FIXTURE.email} (id ${E2E_FIXTURE.id}). NEVER set NEXT_PUBLIC_E2E=1 in production.\x1b[0m\n`,
  );
}

/**
 * Idempotently insert the synthetic E2E user into Postgres so foreign-key
 * relations (projects.user_id, credit_ledger.user_id, …) resolve. Uses a
 * deterministic UUID so successive smoke runs hit the same user.
 */
async function ensureE2EUser(): Promise<User> {
  const [existing] = await db.select().from(users).where(eq(users.id, E2E_FIXTURE.id));
  if (existing) return existing;
  const [created] = await db
    .insert(users)
    .values({
      id:      E2E_FIXTURE.id,
      clerkId: E2E_FIXTURE.clerkId,
      email:   E2E_FIXTURE.email,
    })
    .returning();
  if (!created) throw new Error("failed to seed E2E synthetic user");
  return created;
}

/** Resolve the authenticated Clerk user id (server-only). */
export async function getAuthUserId(): Promise<string | null> {
  if (IS_E2E_BYPASS) { warnE2EOnce(); return E2E_FIXTURE.id; }
  const { userId } = await auth();
  return userId ?? null;
}

/**
 * Resolve the local Postgres user record for the current Clerk session,
 * creating it on the fly if necessary. Idempotent by clerkId.
 */
export async function getOrCreateDbUser(): Promise<User | null> {
  if (IS_E2E_BYPASS) { warnE2EOnce(); return await ensureE2EUser(); }

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
  if (IS_E2E_BYPASS) { warnE2EOnce(); return await ensureE2EUser(); }
  const user = await getOrCreateDbUser();
  if (!user) throw new Error("unauthorized");
  return user;
}
