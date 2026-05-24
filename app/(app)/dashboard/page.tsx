import type { ReactNode } from "react";
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

export default async function DashboardPage() {
  const user = await requireUser();
  const projects = await listProjectsForUser(user.id);
  const balance = await getBalance(user.id);

  const isStudio = user.plan === "studio_monthly" || user.plan === "studio_annual" || user.plan === "lifetime";
  const hasProjects = projects.length > 0;
  const continueProject = hasProjects ? projects[0] : null;
  const continueInfo = continueProject ? projectStatus(continueProject.polotnoJson) : null;
  const continueAction = continueProject && continueInfo
    ? nextActionFor(continueProject.id, continueInfo.status)
    : null;
  const continueDisplay = continueProject && continueInfo
    ? projectStatusDisplay(continueInfo, continueProject.id)
    : null;

  return (
    <>
      <Topbar section="Dashboard" />

      <div className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 text-[13px] text-[var(--fg-mute)]">
              {hasProjects ? "Continue where you left off." : "Start your first screenshot set."}
            </p>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.04em] text-[var(--fg)] leading-[1.02]">
              {hasProjects ? "Your workspace" : "Ready to ship something?"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--accent)] px-4 py-2.5 text-[14px] font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-92"
            >
              <Plus size={15} strokeWidth={2.5} />
              New project
            </Link>
            {!isStudio && (
              <Link
                href="/billing"
                className="inline-flex items-center rounded-[10px] border border-[var(--line)] px-4 py-2.5 text-[14px] text-[var(--fg-dim)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--fg)]"
              >
                Manage billing
              </Link>
            )}
          </div>
        </div>

        {continueProject && continueAction && continueDisplay ? (
          <Link
            href={continueAction.href}
            data-continue-project={continueProject.id}
            data-next-action={continueAction.id}
            className="group mb-8 block surface-raised p-6 sm:p-7 lg:p-8 transition-colors hover:border-[var(--line-strong)]"
          >
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
              <div className="min-w-0">
                <div className="mb-2 text-[13px] text-[var(--fg-mute)]">Continue project</div>
                <h2 className="text-[clamp(1.4rem,2.8vw,2rem)] font-semibold tracking-[-0.03em] text-[var(--fg)] leading-tight">
                  {continueProject.name}
                </h2>
                <p className="mt-3 max-w-[56ch] text-[14.5px] leading-[1.6] text-[var(--fg-dim)]">
                  {continueInfo!.readiness.totalPanels === 0
                    ? `Start shaping the first App Store story for ${continueProject.category || "your app"}.`
                    : `${continueInfo!.readiness.readyPanels} of ${continueInfo!.readiness.totalPanels} panels are ready. Pick up the last step and keep the launch moving.`}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-[var(--fg-mute)]">
                  <span>{continueProject.category || "Uncategorized"}</span>
                  <span aria-hidden>·</span>
                  <span>Updated {timeAgo(continueProject.updatedAt)}</span>
                </div>
              </div>

              <div className="surface p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-[13px] text-[var(--fg-mute)]">Next step</div>
                  <Badge variant={continueDisplay.variant} title={continueDisplay.help}>
                    {continueDisplay.label}
                  </Badge>
                </div>
                <div className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
                  {continueAction.label}
                </div>
                <p className="mt-2 text-[13.5px] leading-[1.55] text-[var(--fg-dim)]">
                  Open the project and continue exactly where the workflow left off.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-[14px] font-medium text-[var(--accent)]">
                  Open now
                  <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <EmptyProjectsCard />
        )}

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <Stat label="Projects" value={String(projects.length)} sub={projects.length === 1 ? "in progress" : "total projects"} />
          <Stat label="Credits" value={isStudio ? "∞" : String(balance)} sub={isStudio ? "Studio plan" : "available now"} tint="accent" />
          <Stat label="Plan" value={planLabel(user.plan)} sub={isStudio ? "active subscription" : "pay as you go"} />
        </div>

        {hasProjects && (
          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-medium text-[var(--fg)]">Recent projects</h2>
                <Link href="/projects" className="inline-flex items-center gap-1 text-[13px] text-[var(--fg-mute)] hover:text-[var(--fg)]">
                  View all
                  <ArrowRight size={13} aria-hidden />
                </Link>
              </div>

              <ul className="grid gap-3 md:grid-cols-2">
                {projects.slice(0, 4).map((p) => {
                  const info = projectStatus(p.polotnoJson);
                  const display = projectStatusDisplay(info, p.id);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.id}`}
                        className="group block surface p-5 transition-colors hover:bg-[var(--bg-3)]"
                        data-project-row={p.id}
                        data-project-status={info.status}
                        data-panels-ready={String(info.readiness.readyPanels)}
                        data-panels-total={String(info.readiness.totalPanels)}
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-[16px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
                              {p.name}
                            </div>
                            <div className="mt-1 text-[13px] text-[var(--fg-mute)]">
                              {p.category || "Uncategorized"}
                            </div>
                          </div>
                          <Badge variant={display.variant} title={display.help}>{display.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4 text-[13px] text-[var(--fg-mute)]">
                          <span>
                            {info.readiness.totalPanels === 0
                              ? "No panels yet"
                              : `${info.readiness.readyPanels} / ${info.readiness.totalPanels} ready`}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            {timeAgo(p.updatedAt)}
                            <ChevronRight size={14} aria-hidden />
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <div className="mb-3 text-[15px] font-medium text-[var(--fg)]">Quick links</div>
              <ul className="space-y-3">
                <QuickStart href="/projects/new" icon={<Plus size={14} />} title="Create a new project" desc="Set the name, pick devices, and start editing." />
                <QuickStart href="/templates" icon={<Sparkles size={14} />} title="Browse templates" desc="Start from a proven layout instead of a blank canvas." />
                <QuickStart href="/docs" icon={<FileText size={14} />} title="Read the docs" desc="Reference billing, exports, surfaces, and setup." />
              </ul>
            </section>
          </div>
        )}
      </div>
    </>
  );
}

function planLabel(plan: string): string {
  switch (plan) {
    case "studio_monthly": return "Studio";
    case "studio_annual": return "Studio";
    case "lifetime": return "Lifetime";
    default: return "Free";
  }
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60_000);
  const hour = Math.floor(diff / 3_600_000);
  const day = Math.floor(diff / 86_400_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hour < 24) return `${hour}h ago`;
  if (day < 7) return `${day}d ago`;
  return date.toISOString().slice(0, 10);
}

function Stat({
  label,
  value,
  sub,
  tint = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tint?: "default" | "accent" | "signal";
}) {
  const color = tint === "accent"
    ? "text-[var(--accent)]"
    : tint === "signal"
      ? "text-[var(--signal)]"
      : "text-[var(--fg)]";

  return (
    <div className="surface p-5">
      <div className="text-[12px] text-[var(--fg-mute)]">{label}</div>
      <div className={`mt-2 text-[28px] font-semibold tracking-[-0.03em] leading-none ${color}`}>
        {value}
      </div>
      {sub && <div className="mt-2 text-[13px] text-[var(--fg-mute)]">{sub}</div>}
    </div>
  );
}

function QuickStart({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <li>
      <Link href={href} className="group flex items-start gap-3 surface p-5 transition-colors hover:bg-[var(--bg-3)]">
        <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-[var(--bg-3)] text-[var(--fg-dim)]">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium text-[var(--fg)]">{title}</span>
          <span className="mt-1 block text-[13px] leading-[1.55] text-[var(--fg-dim)]">{desc}</span>
        </span>
        <ChevronRight size={16} className="mt-1 text-[var(--fg-mute)]" />
      </Link>
    </li>
  );
}

function EmptyProjectsCard() {
  return (
    <div className="mb-8 surface-raised px-6 py-10 sm:px-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="mb-2 text-[13px] text-[var(--fg-mute)]">No projects yet</p>
          <h2 className="text-[clamp(1.75rem,3.8vw,2.6rem)] font-semibold tracking-[-0.035em] text-[var(--fg)] leading-[1.04]">
            Make your first screenshot set in a couple of minutes.
          </h2>
          <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.65] text-[var(--fg-dim)]">
            Start with your app name, choose the devices you plan to ship, then drop in the raw screenshots from Xcode or Simulator.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/projects/new" className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--accent)] px-5 py-3 text-[14px] font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-92">
              Start a project
              <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
            </Link>
            <Link href="/templates" className="text-[14px] text-[var(--fg-dim)] underline decoration-[var(--line-strong)] underline-offset-4 transition-colors hover:text-[var(--fg)] hover:decoration-[var(--accent)]">
              Or start from a template
            </Link>
          </div>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            ["1", "Name the app", "We use it to seed copy and keep the project organized."],
            ["2", "Choose devices", "Pick every screen size you want to export for App Store Connect."],
            ["3", "Drop screenshots", "Upload the raw PNGs now or add them later inside the studio."],
          ].map(([num, title, body]) => (
            <li key={num} className="surface p-4">
              <div className="mb-3 text-[12px] text-[var(--accent)]">Step {num}</div>
              <div className="text-[15px] font-medium text-[var(--fg)]">{title}</div>
              <div className="mt-2 text-[13px] leading-[1.55] text-[var(--fg-dim)]">{body}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
