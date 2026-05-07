/**
 * Zod schema for /api/screenshots/register payloads.
 *
 * Lives in its own file (not the route) so unit tests can import the
 * schema without dragging in `requireUser` → `db` → `neon()` and
 * needing a real Postgres URL at test time. Route handler in
 * `./route.ts` imports from here.
 */

import { z } from "zod";

const DEVICE_ENUM = z.enum(["iphone_69", "iphone_67", "ipad_13"]);

const ItemSchema = z.object({
  device: DEVICE_ENUM,
  /**
   * R2 storage key returned from `/api/upload`. Must look like a key
   * the user owns: `users/<userId>/...` — checked against the auth'd
   * user inside the route handler so the client cannot register a
   * key it didn't upload. Schema-level we just require non-empty +
   * sane length.
   */
  r2Key:  z.string().min(1).max(512),
  width:  z.number().int().positive().max(10_000),
  height: z.number().int().positive().max(10_000),
  locale: z.string().min(2).max(10).default("en"),
});

export const RegisterBodySchema = z.object({
  projectId: z.string().uuid(),
  items:     z.array(ItemSchema).min(1).max(120),
});

export type RegisterBody = z.infer<typeof RegisterBodySchema>;
export type RegisterItem = z.infer<typeof ItemSchema>;
