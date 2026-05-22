import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/app/Topbar";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, Download, Upload } from "lucide-react";
import { requireUser } from "@/lib/auth/clerk";
import { getProject } from "@/lib/db/queries/projects";
import { deriveBadgeState, badgeLabel, type BadgeState } from "@/lib/exports/badge";
import { extractStudioDesignSet } from "@/lib/studio/schema";
import { defaultStudioDesignSet, deviceById } from "@/components/studio/types";
import {
  describeIssues,
  evaluateStudio,
  statusHelp,
  statusLabel,
  statusOf,
} from "@/lib/studio/readiness";

const TARGETS = [
  { id: "iphone_69", label: "iPhone 6.9″", dim: "1290 × 2796" },
  { id: "iphone_67", label: "iPhone 6.7″", dim: "1320 × 2868" },
  { id: "ipad_13",   label: "iPad 13″",    dim: "2064 × 2752" },
] as const;

/**
 * Exports page.
 *
 * Browser audit (2026-05-23): this surface previously claimed
 * `Render now — coming soon` with disabled CTAs while Studio
 * simultaneously claimed `EXPORT READY` on the same empty project.
 * The two were independently lying.
 *
 * The fix routes both surfaces through one readiness model
 * (`lib/studio/readiness.ts`). This page now reflects whether the
 * project is actually ready to export and what's blocking it, and
 * defers the actual export action to Studio (where the browser-side
 * render lives today). A server-authoritative render queue with R2
 * streaming is the v1.1 target — it'll flow in here under the same
 * readiness gate.
 */
export default async function ExportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }    = await params;
  const user      = await requireUser();
  const project   = await getProject(id, user.id);
  if (!project) notFound();

  const activeTargets = project.storeTargets ?? [];
  const studio        = extractStudioDesignSet(project.polotnoJson) ?? defaultStudioDesignSet();
  const readiness     = evaluateStudio(studio);
  const status        = statusOf(readiness);
  const isReady       = readiness.exportable; // at least one panel ready

  /**
   * Per-device panel count + readiness. A device "has frames" when at
   * least one Studio panel targets it; "ready frames" are panels that
   * also pass `evaluatePanel` (screenshot + headline). That's the
   * truthful per-device count the previous hard-coded `FRAMES 0` lied
   * about.
   */
  function statsFor(deviceId: string) {
    const panels = studio.panels.filter((p) => p.deviceId === deviceId);
    const ready  = panels.filter((p) => {
      const r = readiness.perPanel.find((rp) => rp.panelId === p.panelId);
      return r?.ready === true;
    });
    return { total: panels.length, ready: ready.length };
  }

  return (
    <>
      <Topbar section="Exports" breadcrumb={["Operator", "Projects", project.name, "Exports"]} />

      <div className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-7 border-r-0 md:border-r border-[var(--line)] p-5 sm:p-6 md:p-10">
          <div className="t-eyebrow t-eyebrow-accent mb-2">Project · Exports</div>
          <h1 className="t-display text-[clamp(2rem,5.5vw,4.5rem)] leading-[0.92] text-balance">
            EXPORT<br />MATRIX
          </h1>
          <p className="t-prose mt-4 max-w-xl text-[var(--fg-dim)]">
            Browser-side renders run from Studio at exact App Store
            pixel dimensions and land in your Downloads folder. A
            server-authoritative render queue with direct R2 streaming
            + push to App Store Connect is the v1.1 target — it'll
            stream into the history below when it ships.
          </p>
        </div>
        <aside className="col-span-12 md:col-span-5 p-5 sm:p-6 md:p-10 flex flex-col justify-end gap-4 border-t md:border-t-0 border-[var(--line)]">
          <div
            className={`border p-4 ${
              status === "ready"
                ? "border-[var(--signal,#7CB342)]"
                : status === "partial"
                  ? "border-[var(--accent)]"
                  : "border-[var(--line-strong)]"
            }`}
            data-readiness-status={status}
          >
            <div className="flex items-center gap-2">
              {status === "ready" ? (
                <CheckCircle2 size={14} className="text-[var(--signal,#7CB342)]" aria-hidden />
              ) : (
                <AlertTriangle size={14} className="text-[var(--accent)]" aria-hidden />
              )}
              <span className="t-mono-xs uppercase tracking-[0.14em]">
                Readiness · {statusLabel(status)}
              </span>
              <span className="ml-auto t-mono-xs text-[var(--fg-mute)] tabular-nums">
                {readiness.readyPanels} / {readiness.totalPanels} panels
              </span>
            </div>
            <p className="t-mono-xs text-[var(--fg-dim)] mt-2 leading-relaxed">
              {statusHelp(readiness)}
            </p>
          </div>
          <div className="flex gap-2">
            {isReady ? (
              <Link
                href={`/projects/${id}/studio`}
                className="btn btn-accent flex-1 inline-flex items-center justify-center gap-2"
                data-export-cta="open-studio"
              >
                <ArrowRight size={12} /> Open Studio to export
              </Link>
            ) : (
              <Link
                href={`/projects/${id}/studio`}
                className="btn flex-1 inline-flex items-center justify-center gap-2"
                data-export-cta="open-studio-prepare"
                title="Open Studio to add the screenshots + headlines this project still needs before it can export."
              >
                <Upload size={12} /> Prepare in Studio
              </Link>
            )}
            <button
              type="button"
              disabled
              title="App Store Connect direct upload · coming with the v1.1 server-render queue"
              aria-label="Push to App Store Connect — coming with the v1.1 render queue"
              className="btn flex-1 opacity-40 cursor-not-allowed"
            >
              <Upload size={12} /> ASC <span className="text-[var(--fg-mute)]/70 ml-1">· v1.1</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Per-panel checklist — drives the "exactly what remains" call
          asked for in the audit. Only shown when something blocks. */}
      {!readiness.fullyReady && !readiness.empty && (
        <section className="px-5 sm:px-6 py-6 sm:py-8 border-b border-[var(--line)]">
          <div className="t-eyebrow t-eyebrow-accent mb-4">Panels checklist · {readiness.readyPanels} of {readiness.totalPanels}</div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-3xl">
            {readiness.perPanel.map((p, idx) => {
              const panel = studio.panels[idx];
              if (!panel) return null;
              const device = deviceById(panel.deviceId);
              const issues = describeIssues(p.issues);
              return (
                <li
                  key={p.panelId}
                  className="border border-[var(--line)] px-3 py-2 flex items-start gap-3"
                  data-panel-ready={p.ready ? "true" : "false"}
                >
                  {p.ready ? (
                    <CheckCircle2 size={14} className="text-[var(--signal,#7CB342)] mt-0.5 shrink-0" aria-hidden />
                  ) : (
                    <Circle size={14} className="text-[var(--accent)] mt-0.5 shrink-0" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="t-mono-xs text-[var(--fg)] uppercase tracking-[0.14em]">
                      Panel {String(idx + 1).padStart(2, "0")} · {device.shortLabel}
                    </div>
                    <div className="t-mono-xs text-[var(--fg-mute)] mt-1 truncate">
                      {p.ready ? "Ready to export" : issues.join(" · ")}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Targets */}
      <section className="grid grid-cols-1 md:grid-cols-3 grid-rule">
        {TARGETS.map((t) => {
          const enabled = activeTargets.some((id) => id.includes(t.id) || resolveDeviceClass(id) === t.id);
          const stats   = statsFor(t.id);
          const hasReadyFrames = stats.ready > 0;
          return (
            <article
              key={t.id}
              className={`p-5 sm:p-6 min-h-[220px] sm:min-h-[260px] flex flex-col justify-between gap-4 ${
                enabled ? "" : "opacity-50"
              }`}
              data-device-target={t.id}
              data-target-enabled={enabled ? "true" : "false"}
              data-frames-ready={String(stats.ready)}
              data-frames-total={String(stats.total)}
            >
              <header className="flex justify-between items-start gap-3">
                <span className="t-mono-xs text-[var(--fg-mute)] truncate">{t.id.toUpperCase()}</span>
                <DeviceBadge targeted={enabled} framesRendered={stats.ready} framesTotal={stats.total} />
              </header>
              <div className="min-w-0">
                <div className="t-display text-[clamp(1.5rem,2.8vw,1.75rem)] leading-tight truncate">{t.label}</div>
                <div className="t-mono-xs text-[var(--fg-mute)] mt-1 t-numeric">{t.dim}</div>
              </div>
              <dl className="dl-rule">
                <div><dt>PANELS</dt><dd className="t-numeric">{String(stats.total).padStart(2, "0")}</dd></div>
                <div><dt>READY</dt><dd className="t-numeric">{String(stats.ready).padStart(2, "0")}</dd></div>
              </dl>
              {enabled ? (
                <Link
                  href={`/projects/${id}/studio`}
                  className={`btn w-full inline-flex items-center justify-center gap-2 ${
                    hasReadyFrames ? "btn-accent" : "opacity-60"
                  }`}
                  title={
                    hasReadyFrames
                      ? `Open Studio to export the ${stats.ready} ready ${t.label} panel${stats.ready === 1 ? "" : "s"}.`
                      : `Add a ${t.label} panel with a screenshot in Studio to enable export.`
                  }
                >
                  <Download size={12} />
                  {hasReadyFrames ? `Export in Studio` : "Prepare in Studio"}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Add this device class to the project from the wizard or Studio first."
                  aria-label={`Download ${t.label} bundle — device not targeted yet`}
                  className="btn w-full opacity-40 cursor-not-allowed"
                >
                  <Download size={12} /> Not targeted
                </button>
              )}
            </article>
          );
        })}
      </section>

      {/* Render history */}
      <section>
        <div className="px-5 sm:px-6 py-3 border-y border-[var(--line)] flex items-center justify-between flex-wrap gap-2">
          <span className="t-eyebrow t-eyebrow-accent">Render history</span>
          <span className="t-mono-xs text-[var(--fg-mute)]">0 ENTRIES</span>
        </div>
        <div className="px-5 sm:px-6 py-12 sm:py-16 text-center">
          <div className="t-eyebrow t-eyebrow-accent mb-2">No server renders yet</div>
          <p className="t-mono-sm text-[var(--fg-mute)] max-w-md mx-auto">
            Browser exports from Studio land in your Downloads folder
            and don't show here yet. A server-authoritative render
            queue with R2 streaming is the v1.1 target — runs will
            stream here in real time when it ships.
          </p>
        </div>
      </section>

      <div className="px-5 sm:px-6 py-4 t-mono-xs text-[var(--fg-mute)]">
        <Link href={`/projects/${id}`} className="link-tick">← BACK TO PROJECT</Link>
      </div>
    </>
  );
}

/**
 * Map a marketing-catalog device id (e.g. "iphone-17-pro-max") down to
 * the storeTarget enum used in the screenshots table + the TARGETS
 * triplet above. We accept whichever ids the project already stored
 * (the wizard saves catalog ids; legacy projects might have storeTarget
 * enum values).
 */
function resolveDeviceClass(id: string): string {
  if (id === "iphone_69" || id === "iphone_67" || id === "ipad_13") return id;
  // Loose fallback — the targets here are device-CLASS so any iPad
  // catalog id maps to ipad_13. iPhone 6.9 / 6.7 mapping is done
  // exactly in lib/utils/store-dimensions.ts; here we only need the
  // family to drive the targeted-flag.
  if (id.startsWith("ipad")) return "ipad_13";
  // Default to iphone_69 for everything else iPhone-shaped; the
  // page is informational only so a slight over-counting on the
  // 6.9 column is acceptable. Real bucketing lives in the renderer.
  return "iphone_69";
}

/**
 * Renders the device-tile status badge with state-appropriate variant.
 * Now reads real per-device frame counts from the studio panel set —
 * see audit P0 (2026-05-23). The badge progresses:
 *   waiting (targeted, 0 ready)
 *   in-progress (some panels exist, not all ready)
 *   complete (all panels ready)
 *   default (untargeted)
 */
function DeviceBadge({
  targeted,
  framesRendered = 0,
  framesTotal    = 0,
}: {
  targeted:        boolean;
  framesRendered?: number;
  framesTotal?:    number;
}) {
  const state = deriveBadgeState({ targeted, framesRendered, framesTotal });
  const variant: React.ComponentProps<typeof Badge>["variant"] =
    state.kind === "complete"      ? "live" :
    state.kind === "in-progress"   ? "warn" :
    state.kind === "waiting"       ? "live" :
                                     "default";
  return <Badge variant={variant}>{badgeLabel(state)}</Badge>;
}

// Suppress unused-type warning when frame data isn't wired.
export type { BadgeState };
