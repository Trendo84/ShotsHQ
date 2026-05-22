/**
 * Pure UUID-shape guard, kept in its own leaf module so unit tests
 * can import it without dragging in `@/lib/db` (which initialises
 * a Neon client at module-load time and needs a real Postgres URL).
 *
 * Goal: reject obviously-non-uuid strings before they reach Postgres,
 * where a `uuid` column would otherwise throw "invalid input syntax
 * for type uuid" and bubble up as a 500. A stale link like
 * `/projects/p_01` should land as a clean 404.
 *
 * RFC-4122 shape only — we don't validate version bits because the
 * goal is rejection of bad inputs, not strict version classification.
 */

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function isProbablyUuid(value: string): boolean {
  return UUID_RE.test(value);
}
