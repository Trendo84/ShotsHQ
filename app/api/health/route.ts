import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { resolveBuildInfo } from "@/lib/observability/version";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness + readiness probe. Touches the DB with a sub-millisecond
 * `SELECT 1` so monitoring can verify the full path (Vercel function →
 * Neon Postgres). Cheap enough to ping every 30 seconds without burning
 * compute.
 *
 * The `version` field used to be `"dev"` in production because the
 * only source was an env var nobody sets. It now resolves through a
 * documented fallback chain — see `lib/observability/version.ts`.
 * Tooling and incident responders get a real identifier per deploy.
 */
export async function GET() {
  const started = Date.now();
  let dbOk = false;
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const t0 = Date.now();
    await db.execute(sql`select 1`);
    dbLatencyMs = Date.now() - t0;
    dbOk = true;
  } catch (e) {
    dbError = (e as Error).message;
  }

  const totalMs = Date.now() - started;
  const ok = dbOk;
  const build = resolveBuildInfo();

  return Response.json(
    {
      ok,
      service:       "shotshq",
      version:       build.version,
      versionSource: build.source,
      env:           process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      checks: {
        db: { ok: dbOk, latencyMs: dbLatencyMs, error: dbError },
      },
      latencyMs: totalMs,
      ts:        new Date().toISOString(),
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Service": "shotshq",
      },
    },
  );
}
