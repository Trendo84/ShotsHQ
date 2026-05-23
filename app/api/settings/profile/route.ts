/**
 * POST /api/settings/profile — update operator profile fields.
 *
 * Body: { displayName?: string, handle?: string, bio?: string }
 *
 * All three fields are optional in the request — only the keys present
 * in the body are updated, so the client can ship a single field on its
 * own without having to round-trip the rest. Whitespace is trimmed and
 * empty strings are persisted as `""` (the column's NOT NULL DEFAULT)
 * so we never store a NULL where the schema expects a string.
 *
 * Cycle #11 — first real save flow on /settings. The page previously
 * rendered a disabled `Save profile · soon` button that did nothing;
 * now the form is wired through here and the persisted values survive
 * a reload.
 *
 * Validation:
 *   - displayName: up to 50 chars (matches the input's maxLength)
 *   - handle:      3-30 chars, [a-z0-9_-] only (App Store / GitHub-ish)
 *   - bio:         up to 280 chars
 *
 * Auth: Clerk-gated via requireUser(). E2E bypass uses the synthetic
 *       user from lib/auth/clerk.ts so the e2e spec can exercise the
 *       full round-trip without spinning up a Clerk session.
 */

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { apiLimiter, limit } from "@/lib/utils/ratelimit";
import { logError } from "@/lib/observability/log";

export const runtime = "nodejs";

const HANDLE_RE = /^[a-z0-9_-]+$/i;

const Body = z.object({
  displayName: z
    .string()
    .trim()
    .max(50, "Display name must be 50 characters or fewer")
    .optional(),
  handle: z
    .string()
    .trim()
    .max(30, "Handle must be 30 characters or fewer")
    .refine((v) => v === "" || (v.length >= 3 && HANDLE_RE.test(v)), {
      message: "Handle must be 3-30 characters, letters / digits / _ / - only",
    })
    .optional(),
  bio: z
    .string()
    .trim()
    .max(280, "Bio must be 280 characters or fewer")
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const { success } = await limit(apiLimiter, `profile:${user.id}`);
    if (!success) {
      return Response.json(
        { ok: false, error: "rate_limited", code: 429 },
        { status: 429 },
      );
    }

    const raw = await req.json().catch(() => null);
    const parsed = Body.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return Response.json(
        {
          ok: false,
          error: first?.message ?? "invalid_body",
          code: 400,
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // Build a partial update — only patch fields present in the body.
    // This keeps the route additive: a client can save just the handle
    // without round-tripping displayName / bio it didn't intend to
    // change.
    const patch: { displayName?: string; handle?: string; bio?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (parsed.data.displayName !== undefined) patch.displayName = parsed.data.displayName;
    if (parsed.data.handle      !== undefined) patch.handle      = parsed.data.handle;
    if (parsed.data.bio         !== undefined) patch.bio         = parsed.data.bio;

    const [updated] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, user.id))
      .returning({
        displayName: users.displayName,
        handle:      users.handle,
        bio:         users.bio,
      });

    if (!updated) {
      return Response.json(
        { ok: false, error: "not_found", code: 404 },
        { status: 404 },
      );
    }

    return Response.json({ ok: true, data: updated });
  } catch (err) {
    logError("settings.profile.update_failed", err);
    return Response.json(
      { ok: false, error: "internal_error", code: 500 },
      { status: 500 },
    );
  }
}
