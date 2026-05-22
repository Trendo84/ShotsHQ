import { describe, it, expect } from "vitest";
import { isProbablyUuid } from "@/lib/db/uuid";

/**
 * Audit finding `2026-05-22-live-site-app-fix-brief.md` P1-4: the live
 * site 500'd on `/projects/p_01` (a stale doc reference) because the
 * non-uuid string was passed straight to Drizzle, which threw a Postgres
 * "invalid input syntax for type uuid" deep in the request path. The
 * `getProject` helper now short-circuits non-uuid IDs via this guard,
 * landing those URLs as clean 404s.
 *
 * These tests pin the regex shape — if someone "loosens" it later (e.g.
 * to accept a prefix like "p_*") they should have to actively edit the
 * test, not silently break the 404 contract.
 */
describe("isProbablyUuid()", () => {
  it("accepts a well-formed v4 uuid", () => {
    expect(isProbablyUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("accepts uppercase hex digits (RFC 4122 §3 allows them)", () => {
    expect(isProbablyUuid("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("rejects the stale fixture id `p_01`", () => {
    expect(isProbablyUuid("p_01")).toBe(false);
  });

  it("rejects the empty string", () => {
    expect(isProbablyUuid("")).toBe(false);
  });

  it("rejects a uuid with too few groups", () => {
    expect(isProbablyUuid("550e8400-e29b-41d4-a716")).toBe(false);
  });

  it("rejects a uuid with non-hex characters", () => {
    expect(isProbablyUuid("zzzzzzzz-e29b-41d4-a716-446655440000")).toBe(false);
  });

  it("rejects an extra trailing segment", () => {
    expect(isProbablyUuid("550e8400-e29b-41d4-a716-446655440000-extra")).toBe(false);
  });

  it("rejects whitespace padding", () => {
    expect(isProbablyUuid(" 550e8400-e29b-41d4-a716-446655440000 ")).toBe(false);
  });
});
