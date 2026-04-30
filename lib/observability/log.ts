import * as Sentry from "@sentry/nextjs";

/**
 * Centralized error logger. Wraps `console.error` so it always also
 * reports to Sentry in environments where Sentry is initialized
 * (production with `SENTRY_DSN` set; preview deploys can opt-in).
 *
 * Usage:
 *   import { logError } from "@/lib/observability/log";
 *   logError("[stripe.webhook] verify failed", err, { headers: signed });
 *
 * - First arg is a stable scope label used as the breadcrumb message
 *   AND as the "what failed" string in PagerDuty/Sentry triage.
 * - Second arg is the thrown value or Error. We coerce to an Error so
 *   stack traces survive Sentry serialization.
 * - Optional `context` becomes `extra` data on the Sentry event.
 *
 * Falls back to `console.error` when Sentry isn't enabled (e.g. local
 * dev) so logs aren't lost. The Sentry SDK is itself a no-op when
 * `enabled: false`, so calling `captureException` always has well-
 * defined behavior.
 */
export function logError(
  scope: string,
  err: unknown,
  context?: Record<string, unknown>,
): void {
  // Always emit to console for local visibility + server logs.
  // eslint-disable-next-line no-console
  console.error(scope, err, context ?? "");

  const error = err instanceof Error ? err : new Error(safeStringify(err));

  Sentry.withScope((s) => {
    s.setTag("scope", scope);
    if (context) {
      // Cap each context value to avoid sending megabytes to Sentry
      // (e.g. full request bodies, stack-trace recursion).
      for (const [k, v] of Object.entries(context)) {
        s.setExtra(k, truncate(v));
      }
    }
    Sentry.captureException(error);
  });
}

function safeStringify(value: unknown): string {
  try {
    return typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function truncate(v: unknown): unknown {
  if (typeof v === "string" && v.length > 2000) return `${v.slice(0, 2000)}…`;
  return v;
}
