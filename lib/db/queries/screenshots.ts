/**
 * Screenshots table queries.
 *
 * Today the only writer was `trigger/tasks/render-screenshot.ts` (the
 * EXPORT side — sharp renders a PNG, uploads to R2, registers the
 * row). Capture v1.1 introduces an INTAKE side: user drops PNGs, the
 * client uploads via the existing presign route, then calls
 * `/api/screenshots/register` which lands here.
 *
 * Idempotency
 * -----------
 * Drizzle has no unique constraint on `(projectId, device, r2Key)`.
 * We achieve idempotency in code: SELECT existing rows for the same
 * triple, return their ids, only INSERT the rest. Duplicate
 * registration calls (network retries, double-clicks) are safe.
 *
 * A schema-level unique index would be a nicer long-term solution but
 * requires a migration; the in-code check covers the realistic
 * collision shape (same uploaded file registered twice) without
 * touching DDL.
 */

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { screenshots, type Screenshot } from "@/lib/db/schema";
import type { StoreTarget } from "@/lib/utils/store-dimensions";

export type RegisterScreenshotItem = {
  device: StoreTarget;
  r2Key:  string;
  width:  number;
  height: number;
  locale: string;
};

export type RegisterScreenshotsResult = {
  /** Newly inserted ids (in input order, with skipped-duplicate slots = existing id). */
  ids:      string[];
  /** How many of the input items were already present (skipped). */
  skipped:  number;
  /** How many were freshly inserted. */
  inserted: number;
};

/**
 * Insert screenshot rows for `projectId`, skipping any whose `r2Key`
 * already exists for the same `(projectId, device)` pair.
 *
 * Returns the resolved id for every input item — duplicates resolve
 * to the existing row's id, so the caller can land in the editor with
 * a complete frame manifest regardless of retry history.
 */
export async function registerScreenshots(
  projectId: string,
  items:     RegisterScreenshotItem[],
): Promise<RegisterScreenshotsResult> {
  if (items.length === 0) {
    return { ids: [], skipped: 0, inserted: 0 };
  }

  // Pre-check: which r2Keys already exist for this project? (Across
  // all device classes — r2Keys are unique per upload via nanoid, so
  // a collision is always a true duplicate.)
  const inputKeys = items.map((i) => i.r2Key);
  const existing  = await db
    .select({ id: screenshots.id, r2Key: screenshots.r2Key })
    .from(screenshots)
    .where(and(
      eq(screenshots.projectId, projectId),
      inArray(screenshots.r2Key, inputKeys),
    ));

  const existingByKey = new Map<string, string>();
  for (const row of existing) existingByKey.set(row.r2Key, row.id);

  // Partition into already-present (skip) vs. fresh (insert).
  const fresh = items.filter((i) => !existingByKey.has(i.r2Key));

  let inserted: Screenshot[] = [];
  if (fresh.length > 0) {
    inserted = await db
      .insert(screenshots)
      .values(fresh.map((i) => ({
        projectId,
        device: i.device,
        r2Key:  i.r2Key,
        width:  i.width,
        height: i.height,
        locale: i.locale,
      })))
      .returning();
  }

  // Build the insertedByKey lookup for the final id mapping.
  const insertedByKey = new Map<string, string>();
  for (const row of inserted) insertedByKey.set(row.r2Key, row.id);

  // Assemble final id list in input order (caller can map 1:1).
  const ids = items.map((i) => {
    const id = existingByKey.get(i.r2Key) ?? insertedByKey.get(i.r2Key);
    if (!id) throw new Error(`Missing id for r2Key after insert: ${i.r2Key}`);
    return id;
  });

  return {
    ids,
    skipped:  existingByKey.size,
    inserted: inserted.length,
  };
}
