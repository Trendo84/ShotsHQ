"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";

/**
 * Error boundary for the editor route. Before this file existed, a throw
 * during `EditorClient` mount (e.g. malformed `polotnoJson` causing
 * Fabric to choke) propagated past the route segment and the user saw
 * a blank screen with no recourse — see audit finding
 * `docs/audits/2026-04-30-comet-sonnet-editor.md` #2 ("Open editor
 * button doesn't reliably fire"). The button worked; the route silently
 * failed.
 *
 * Now: failures render this loud, brand-styled error UI with the
 * project id and an exit-to-project link. Users can screenshot and
 * report; we can grep Sentry for matching error names.
 *
 * The `error` prop receives the thrown Error (with .digest from Next's
 * server-side error boundary). The `reset` callback re-runs the
 * segment's render — useful when the error was a transient hydration
 * issue.
 */
export default function EditorErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? "(unknown)";

  useEffect(() => {
    // Surface to console + (if Sentry's wired in this client bundle) the
    // breadcrumb tracker. The lib/observability/log.ts helper is server-
    // only; client-side we just log to the browser console here, and
    // Next's built-in `digest` already correlates to a server log entry.
    // eslint-disable-next-line no-console
    console.error("[editor.error] route boundary caught", {
      projectId,
      message: error.message,
      digest: error.digest,
    });
  }, [error, projectId]);

  return (
    <div className="min-h-dvh w-full grid place-items-center p-4 sm:p-8 bg-[var(--bg)]">
      <div className="max-w-xl w-full border-2 border-[var(--accent)] bg-[var(--bg)] p-6 sm:p-10 shadow-[8px_8px_0_var(--accent)]">
        <div className="t-mono-xs text-[var(--accent)] mb-4">[ EDITOR · ERROR ]</div>
        <h1 className="t-display text-[clamp(1.75rem,5vw,3rem)] leading-[0.92] mb-3">
          The editor<br />
          <span className="text-[var(--accent)]">didn&apos;t open.</span>
        </h1>
        <p className="t-prose text-[var(--fg-dim)] leading-relaxed">
          Something failed while loading this project&apos;s canvas. The
          most common cause is a malformed save from an older client. The
          project&apos;s data is safe — we just couldn&apos;t mount the
          editor view.
        </p>

        <dl className="mt-6 t-mono-xs text-[var(--fg-mute)] space-y-1.5">
          <div className="flex gap-3">
            <dt className="w-24 shrink-0">PROJECT</dt>
            <dd className="text-[var(--fg)] truncate">{projectId}</dd>
          </div>
          {error.digest && (
            <div className="flex gap-3">
              <dt className="w-24 shrink-0">DIGEST</dt>
              <dd className="text-[var(--fg)] truncate">{error.digest}</dd>
            </div>
          )}
          <div className="flex gap-3">
            <dt className="w-24 shrink-0">MESSAGE</dt>
            <dd className="text-[var(--fg)] truncate">{error.message || "(no message)"}</dd>
          </div>
        </dl>

        <div className="hazard h-2 mt-6" aria-hidden />

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={reset}
            className="btn btn-accent flex-1"
          >
            Try again
          </button>
          <Link
            href={`/projects/${projectId}`}
            className="btn flex-1 text-center"
          >
            Back to project
          </Link>
          <Link
            href="/dashboard"
            className="t-mono-xs text-[var(--fg-mute)] hover:text-[var(--accent)] flex items-center justify-center px-3"
          >
            Dashboard
          </Link>
        </div>

        <p className="t-mono-xs text-[var(--fg-mute)] mt-6 leading-relaxed">
          If this keeps happening, screenshot this screen (especially the
          DIGEST line) and email <a className="link-tick" href="mailto:support@shotshq.com">support@shotshq.com</a>.
        </p>
      </div>
    </div>
  );
}
