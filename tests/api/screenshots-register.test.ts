import { describe, it, expect } from "vitest";
import { RegisterBodySchema } from "@/app/api/screenshots/register/schema";

/**
 * Pure-logic test of the /api/screenshots/register Zod body schema.
 *
 * Doesn't boot a real DB or hit the route handler; the route's DB
 * call is in `lib/db/queries/screenshots.ts` (separately tested via
 * integration if/when needed). What we're verifying here is the
 * INPUT contract — a malformed payload from the client should fail
 * with a recognisable Zod error, not throw deeper in the handler.
 */

const VALID_ITEM = {
  device: "iphone_69" as const,
  r2Key:  "users/abc-123/projects/def-456/screen.png",
  width:  1290,
  height: 2796,
  locale: "en",
};

const VALID_BODY = {
  projectId: "00000000-0000-4000-8000-000000000000", // valid v4 uuid shape
  items:     [VALID_ITEM],
};

describe("/api/screenshots/register Zod schema", () => {
  it("accepts a well-formed payload", () => {
    const parsed = RegisterBodySchema.safeParse(VALID_BODY);
    expect(parsed.success).toBe(true);
  });

  it("defaults locale to 'en' when omitted", () => {
    const { locale: _, ...item } = VALID_ITEM;
    void _;
    const parsed = RegisterBodySchema.safeParse({
      ...VALID_BODY,
      items: [item],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.items[0]?.locale).toBe("en");
    }
  });

  it("rejects when projectId is not a uuid", () => {
    const parsed = RegisterBodySchema.safeParse({
      ...VALID_BODY,
      projectId: "not-a-uuid",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects when items is empty (must register ≥1 file)", () => {
    const parsed = RegisterBodySchema.safeParse({
      ...VALID_BODY,
      items: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects items > 120 (batch ceiling)", () => {
    const parsed = RegisterBodySchema.safeParse({
      ...VALID_BODY,
      items: Array.from({ length: 121 }, () => VALID_ITEM),
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown device enum values (must be iphone_69 / iphone_67 / ipad_13)", () => {
    const parsed = RegisterBodySchema.safeParse({
      ...VALID_BODY,
      items: [{ ...VALID_ITEM, device: "android_pixel" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects non-positive dimensions", () => {
    const parsed = RegisterBodySchema.safeParse({
      ...VALID_BODY,
      items: [{ ...VALID_ITEM, width: 0 }],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects fractional dimensions (PNGs are integer pixels)", () => {
    const parsed = RegisterBodySchema.safeParse({
      ...VALID_BODY,
      items: [{ ...VALID_ITEM, width: 1290.5 }],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects absurdly large dimensions (>10,000 px)", () => {
    const parsed = RegisterBodySchema.safeParse({
      ...VALID_BODY,
      items: [{ ...VALID_ITEM, width: 99999 }],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty r2Key", () => {
    const parsed = RegisterBodySchema.safeParse({
      ...VALID_BODY,
      items: [{ ...VALID_ITEM, r2Key: "" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects extremely long r2Key (>512)", () => {
    const parsed = RegisterBodySchema.safeParse({
      ...VALID_BODY,
      items: [{ ...VALID_ITEM, r2Key: "x".repeat(513) }],
    });
    expect(parsed.success).toBe(false);
  });
});
