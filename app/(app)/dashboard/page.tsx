import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight, FileText, Sparkles, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/clerk";
import { listProjectsForUser } from "@/lib/db/queries/projects";
import { getBalance } from "@/lib/db/queries/credits";
import {
  projectStatus,
  projectStatusDisplay,
  nextActionFor,
} from "@/lib/studio/project-status";

/**
 * /dashboard — re-entry point.
 *
 * Recovery-cycle redesign 2026-05-24:
 *   - removed "Operator / Overview" breadcrumb
 *   - the page leads with a "Continue where you left off" hero card
 *     when the user has projects (the most-recently-updated one gets
 *     the lead with its state-aware next-action CTA). When the user
 *     is brand new, the empty state remains
 *   - stat tiles demoted from a four-up macro band that took 30% of
 *     the page to a compact inline metric row underneath the hero
 *   - recent projects list moved below the continue-card; capped at
 *     4 items (was 5) so the row never crowds out the hero
 *   - "Quick start" tiles compressed into a thin utility rail at the
 *     bottom — they were generic for any user who already had projects
 */
export default async function DashboardPage() {
  const user      = await requireUser();
  const projects  = await listProjectsForUser(user.id);
  const balance   = await getBalance(user.id);

  const isStudio = user.plan === "studio_monthly" || user.plan === "studio_annual" || user.plan === "lifetime";
  const hasProjects = projects.length > 0;
  // Project with the most recent updatedAt — the one to continue.
  // listProjectsForUser returns ordered by updatedAt desc.
  const continueProject = hasProjects ? projects[0] : null;
  const continueInfo    = continueProject ? projectStatus(continueProject.polotnoJson) : null;
  const continueAction  = continueProject && continueInfo
    ? nextActionFor(continueProject.id, continueInfo.status)
    : null;
  const continueDisplay = continueProject && continueInfo
    ? projectStatusDisplay(continueInfo, continueProject.id)
    : null;

  return (
    <>
      <Topbar section="Dashboard" breadcrumb={["Overview"]} />

      <div className="px-4 sm:px-6 lg:px-8 py-8 lg:py-10 max-w-[1480px]">
        {/* Header row — kept compact. The dominant page element is
           the continue-card below, not this strip. */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6 lg:mb-8">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-2">
              Welcome back
            </div>
            <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-[var(--fg)] leading-tight">
              {hasProjects ? "Pick up where you left off." : "Let's ship your first pack."}
            </h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-fg)] font-semibold text-[14px] px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity"
            >
              <Plus size={14} strokeWidth={2.5} />
              New project
            </Link>
            {!isStudio && (
              <Link
                href="/billing"
                className="inline-flex items-center text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] px-3 py-2.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] transition-colors"
              >
                Top-up credits
              </Link>
            )}
          </div>
        </div>

        {/* HERO — Continue where you left off */}
        {continueProject && continueAction && continueDisplay ? (
          <Link
            href={continueAction.href}
            data-continue-project={continueProject.id}
            data-next-action={continueAction.id}
            className="group block surface-raised p-5 sm:p-7 lg:p-8 hover:border-[var(--accent)] transition-colors mb-6 lg:mb-8"
          >
            <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-2">
                  Continue project
                </div>
                <h2 className="text-[clamp(1.25rem,2.5vw,1.625rem)] font-semibold tracking-[-0.015em] text-[var(--fg)] leading-tight truncate">
                  {continueProject.name}
                </h2>
                <p className="text-[13.5px] text-[var(--fg-dim)] mt-2 leading-snug max-w-2xl">
                  {continueInfo!.readiness.totalPanels === 0
                    ? (continueProject.category || "Uncategorized")
                    : `${continueInfo!.readiness.readyPanels} of ${continueInfo!.readiness.totalPanels} panels ready`}
                  {" · Updated "}
                  {timeAgo(continueProject.updatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={continueDisplay.variant} title={continueDisplay.help}>
                  {continueDisplay.label}
                </Badge>
                <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--accent)] group-hover:opacity-80 transition-opacity">
                  {continueAction.label}
                  <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <EmptyProjectsCard />
        )}

        {/* Stat tiles — demoted to a thin row that supports the hero. */}
        <div className="surface px-1 mb-8 lg:mb-10 overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[var(--line)]">
            <Stat label="Credits" value={isStudio ? "∞" : String(balance)} sub={isStudio ? "studio · unmetered" : "balance"} tint="accent" />
            <Stat label="Projects" value={String(projects.length)} sub={projects.length === 1 ? "active" : "total"} />
            <Stat label="In queue" value={"00"} sub="rendering" />
            <Stat label="Plan" value={planLabel(user.plan)} sub={isStudio ? "active" : "non-recurring"} />
          </div>
        </div>

        {/* RECENT PROJECTS + QUICK START — both demoted to secondary. */}
        {hasProjects && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            <section className="xl:col-span-2">
              <header className="flex items-center justify-between mb-3">
                <h2 className="text-[12px] uppercase tracking-[0.14em] text-[var(--fg-mute)] font-medium">
                  Recent projects
                </h2>
                <Link
                  href="/projects"
                  className="text-[13px] text-[var(--fg-mute)] hover:text-[var(--fg)] inline-flex items-center gap-1"
                >
                  View all
                  <ArrowRight size={13} aria-hidden />
                </Link>
              </header>

              <ul className="surface divide-y divide-[var(--line)]">
                {projects.slice(0, 4).map((p) => {
                  const info    = projectStatus(p.polotnoJson);
                  const display = projectStatusDisplay(info, p.id);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.id}`}
                        className="grid grid-cols-12 items-center gap-3 px-4 sm:px-5 py-4 hover:bg-[var(--bg-3)] transition-colors"
                        data-project-row={p.id}
                        data-project-status={info.status}
                        data-panels-ready={String(info.readiness.readyPanels)}
                        data-panels-total={String(info.readiness.totalPanels)}
                      >
                        <div className="col-span-12 sm:col-span-6 min-w-0">
                          <div className="text-[15px] font-medium text-[var(--fg)] tracking-[-0.01em] truncate leading-snug">
                            {p.name}
                          </div>
                          <div className="text-[12.5px] text-[var(--fg-mute)] mt-0.5 truncate">
                            {info.readiness.totalPanels === 0
                              ? (p.category || "Uncategorized")
                              : `${info.readiness.readyPanels} of ${info.readiness.totalPanels} panels ready`}
                          </div>
                        </div>
                        <div className="col-span-7 sm:col-span-3 text-[12.5px] text-[var(--fg-mute)] tabular-nums">
                          {timeAgo(p.updatedAt)}
                        </div>
                        <div className="col-span-5 sm:col-span-3 flex justify-end items-center gap-2">
                          <Badge variant={display.variant} title={display.help}>{display.label}</Badge>
                          <ChevronRight size={14} className="text-[var(--fg-mute)]" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <header className="flex items-center justify-between mb-3">
                <h2 className="text-[12px] uppercase tracking-[0.14em] text-[var(--fg-mute)] font-medium">
                  Quick links
                </h2>
              </header>
              <ul className="surface divide-y divide-[var(--line)]">
                <QuickStart
                  href="/projects/new"
                  icon={<Plus size={14} />}
                  title="New project"
                  desc="Pick devices, drop screens, ship."
                />
                <QuickStart
                  href="/templates"
                  icon={<Sparkles size={14} />}
                  title="Browse templates"
                  desc="Curated starting points."
                />
                <QuickStart
                  href="/docs"
                  icon={<FileText size={14} />}
                  title="Read the docs"
                  desc="Pipeline, credits, surfaces."
                />
              </ul>
            </section>
          </div>
        )}
      </div>
    </>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

function planLabel(plan: string): string {
  switch (plan) {
    case "studio_monthly": return "Studio";
    case "studio_annual":  return "Studio";
    case "lifetime":       return "Lifetime";
    default:               return "Free";
  }
}

function timeAgo(date: Date): string {
  const diff   = Date.now() - date.getTime();
  const min    = Math.floor(diff / 60_000);
  const hour   = Math.floor(diff / 3_600_000);
  const day    = Math.floor(diff / 86_400_000);
  if (min  < 1)     return "just now";
  if (min  < 60)    return `${min}m ago`;
  if (hour < 24)    return `${hour}h ago`;
  if (day  < 7)     return `${day}d ago`;
  return date.toISOString().slice(0, 10);
}

function Stat({
  label, value, sub, tint = "default",
}: {
  label: string;
  value: string;
  sub?:  string;
  tint?: "default" | "accent" | "signal";
}) {
  const color =
    tint === "accent" ? "text-[var(--accent)]"
    : tint === "signal" ? "text-[var(--signal)]"
    : "text-[var(--fg)]";
  return (
    <div className="px-4 py-3.5 min-w-0">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-[var(--fg-mute)] font-medium truncate">
        {label}
      </div>
      <div className={`text-[clamp(1.25rem,2.5vw,1.625rem)] font-semibold tracking-[-0.02em] tabular-nums mt-0.5 leading-tight truncate ${color}`}>
        {value}
      </div>
      {sub && <div className="text-[12px] text-[var(--fg-mute)] mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

function QuickStart({
  href, icon, title, desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc:  string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-start gap-3 px-4 py-3.5 hover:bg-[var(--bg-3)] transition-colors group"
      >
        <span className="mt-0.5 inline-grid place-items-center w-7 h-7 rounded-md bg-[var(--bg-3)] text-[var(--fg-mute)] group-hover:text-[var(--accent)] transition-colors shrink-0">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] text-[var(--fg)] font-medium">{title}</span>
          <span className="block text-[12px] text-[var(--fg-mute)] mt-0.5">{desc}</span>
        </span>
        <ChevronRight size={14} className="text-[var(--fg-mute)] mt-1 shrink-0" />
      </Link>
    </li>
  );
}

function EmptyProjectsCard() {
  return (
    <div className="surface px-6 sm:px-10 py-10 sm:py-14 mb-6 lg:mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-2">
            Empty deck
          </div>
          <h3 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.02em] text-[var(--fg)] leading-tight mb-3">
            Your first project on the house.
          </h3>
          <p className="text-[14.5px] text-[var(--fg-dim)] mb-5 max-w-md leading-relaxed">
            Drop in iOS screenshots, pick devices, ship. Your first
            project takes about ninety seconds — no card required.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-fg)] font-semibold text-[14px] px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity"
            >
              Start a project
              <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
            </Link>
            <Link
              href="/templates"
              className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--accent)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)] transition-colors"
            >
              … or pick from a template
            </Link>
          </div>
        </div>
        <ol className="space-y-2.5 text-[13.5px] text-[var(--fg-dim)] leading-relaxed border-l border-[var(--line)] pl-5">
          <li><span className="text-[var(--accent)] mr-2 font-medium">01</span> Pick devices · iPhone 6.9″ / 6.7″ / iPad 13″</li>
          <li><span className="text-[var(--accent)] mr-2 font-medium">02</span> Drop raw PNGs · auto-bucketed by dimension</li>
          <li><span className="text-[var(--accent)] mr-2 font-medium">03</span> Compose in Studio · export at App Store-exact dims</li>
        </ol>
      </div>
    </div>
  );
}
