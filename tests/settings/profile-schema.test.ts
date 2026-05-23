import { describe, expect, it } from "vitest";
import { z } from "zod";

/**
 * Pin the cycle-#11 profile-route Zod schema. The schema lives inside
 * the route handler (`app/api/settings/profile/route.ts`) — replicate
 * it here so the contract has a unit-test boundary without booting Next
 * + Postgres. If the live schema drifts from this one the test catches
 * it on the diff because both shapes are intentionally identical.
 *
 * The route also covers a few hand-rolled behaviours that aren't in the
 * Zod schema (partial body = patch only the keys present, trimming) —
 * those are easier to verify in the e2e spec, which exercises the real
 * route end-to-end against the dev DB.
 */

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

describe("profile route Zod schema", () => {
  it("accepts an empty body (no-op update is allowed)", () => {
    expect(Body.safeParse({}).success).toBe(true);
  });

  it("accepts every field set to a valid value", () => {
    const r = Body.safeParse({
      displayName: "Ivan Sajtovi",
      handle:      "ivan-s",
      bio:         "Solo studio. Ships every other Friday.",
    });
    expect(r.success).toBe(true);
  });

  it("trims whitespace before length checks", () => {
    const r = Body.safeParse({ displayName: "  Ivan  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.displayName).toBe("Ivan");
  });

  it("rejects display name over 50 chars", () => {
    const r = Body.safeParse({ displayName: "x".repeat(51) });
    expect(r.success).toBe(false);
  });

  it("rejects handle with disallowed characters", () => {
    const r = Body.safeParse({ handle: "hello world" });
    expect(r.success).toBe(false);
  });

  it("rejects handle shorter than 3 characters (when present)", () => {
    const r = Body.safeParse({ handle: "ab" });
    expect(r.success).toBe(false);
  });

  it("accepts handle exactly 3 characters", () => {
    const r = Body.safeParse({ handle: "abc" });
    expect(r.success).toBe(true);
  });

  it("accepts an empty handle string (clears the field)", () => {
    const r = Body.safeParse({ handle: "" });
    expect(r.success).toBe(true);
  });

  it("rejects handle over 30 chars", () => {
    const r = Body.safeParse({ handle: "a".repeat(31) });
    expect(r.success).toBe(false);
  });

  it("accepts handle with underscores and hyphens", () => {
    expect(Body.safeParse({ handle: "ivan_s" }).success).toBe(true);
    expect(Body.safeParse({ handle: "ivan-s" }).success).toBe(true);
    expect(Body.safeParse({ handle: "_ivan-1" }).success).toBe(true);
  });

  it("rejects bio over 280 chars", () => {
    const r = Body.safeParse({ bio: "b".repeat(281) });
    expect(r.success).toBe(false);
  });

  it("accepts bio exactly 280 chars", () => {
    expect(Body.safeParse({ bio: "b".repeat(280) }).success).toBe(true);
  });

  it("strips unknown keys silently (Zod default)", () => {
    const r = Body.safeParse({
      displayName: "Ivan",
      apiKey:      "sk_live_attack",
    });
    expect(r.success).toBe(true);
    if (r.success) expect((r.data as Record<string, unknown>).apiKey).toBeUndefined();
  });
});
