import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight, FileText, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/clerk";
import { listProjectsForUser } from "@/lib/db/queries/projects";
import { getBalance } from "@/lib/db/queries/credits";

export default async function DashboardPage() {
  const user      = await requireUser();
  const projects  = await listProjectsForUser(user.id);
  const balance   = await getBalance(user.id);

  const renderingCount = 0; // wire to aiJobs query when render queue is live
  const isStudio       = user.plan === "studio_monthly" || user.plan === "studio_annual" || user.plan === "lifetime";

  return (
    <>
      <Topbar section="Dashboard" breadcrumb={["Operator", "Overview"]} />

      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-10 max-w-[1480px]">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8 lg:mb-10">
          <div className="min-w-0">
            <div className="t-eyebrow t-eyebrow-accent mb-2">Welcome back</div>
            <h1 className="t-display text-[clamp(1.75rem,4vw,3.5rem)] leading-[0.95] text-balance">
              Today&apos;s queue.
            </h1>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/projects/new" className="btn btn-accent"><Plus size={13} /> New project</Link>
            {!isStudio && <Link href="/billing" className="btn">Top-up credits</Link>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] mb-10 lg:mb-12">
          <Stat
            label="Credits"
            value={isStudio ? "∞" : String(balance)}
            sub={isStudio ? "studio · unmetered" : "current balance"}
            tint="accent"
          />
          <Stat label="Projects" value={String(projects.length)} sub="across all plans" />
          <Stat label="In queue" value={String(renderingCount).padStart(2, "0")} sub="rendering" />
          <Stat label="Plan"     value={planLabel(user.plan)} sub={isStudio ? "active" : "non-recurring"} tint="signal" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          <section className="xl:col-span-2">
            <header className="flex items-center justify-between mb-3">
              <h2 className="t-eyebrow">Projects</h2>
              <Link href="/projects" className="text-[13px] text-[var(--fg-mute)] hover:text-[var(--fg)]">View all →</Link>
            </header>

            {projects.length === 0 ? (
              <EmptyProjectsCard />
            ) : (
              <ul className="border border-[var(--line)]">
                {projects.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/projects/${p.id}`}
                      className="grid grid-cols-12 items-center gap-3 px-4 py-4 border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--bg-2)] transition-colors"
                    >
                      <div className="col-span-12 sm:col-span-6 min-w-0">
                        <div className="t-display text-[18px] sm:text-[20px] leading-tight normal-case tracking-[-0.02em] truncate">
                          {p.name}
                        </div>
                        <div className="text-[12.5px] text-[var(--fg-mute)] mt-0.5 truncate">
                          {p.category ?? "Uncategorized"}
                        </div>
                      </div>
                      <div className="col-span-7 sm:col-span-3 text-[12.5px] text-[var(--fg-mute)] tabular-nums">
                        {timeAgo(p.updatedAt)}
                      </div>
                      <div className="col-span-5 sm:col-span-3 flex justify-end items-center gap-2">
                        <Badge>Draft</Badge>
                        <ChevronRight size={14} className="text-[var(--fg-mute)]" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <header className="flex items-center justify-between mb-3">
              <h2 className="t-eyebrow">Quick start</h2>
            </header>
            <ul className="border border-[var(--line)] divide-y divide-[var(--line)]">
              <QuickStart
                href="/projects/new"
                icon={<Plus size={14} />}
                title="New project"
                desc="Pick devices, drop screenshots, ship."
              />
              <QuickStart
                href="/templates"
                icon={<Sparkles size={14} />}
                title="Browse templates"
                desc="Style starting points by app category."
              />
              <QuickStart
                href="/docs"
                icon={<FileText size={14} />}
                title="Read the docs"
                desc="API, credit system, surface specs."
              />
            </ul>
          </section>
        </div>
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
  const now    = Date.now();
  const diff   = now - date.getTime();
  const min    = Math.floor(diff / 60_000);
  const hour   = Math.floor(diff / 3_600_000);
  const day    = Math.floor(diff / 86_400_000);
  if (min  < 1)     return "just now";
  if (min  < 60)    return `${min} min ago`;
  if (hour < 24)    return `${hour}h ago`;
  if (day  < 7)     return `${day}d ago`;
  return date.toISOString().slice(0, 10);
}

// ── components ───────────────────────────────────────────────────────────────

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
    <div className="bg-[var(--bg)] p-4 sm:p-5">
      <div className="t-eyebrow truncate">{label}</div>
      <div className={`t-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[0.9] mt-2 t-numeric ${color} truncate`}>
        {value}
      </div>
      {sub && <div className="text-[12px] text-[var(--fg-mute)] mt-2 truncate">{sub}</div>}
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
        className="flex items-start gap-3 px-4 py-3.5 hover:bg-[var(--bg-2)] transition-colors group"
      >
        <span className="mt-0.5 inline-grid place-items-center w-6 h-6 border border-[var(--line)] text-[var(--fg-mute)] group-hover:text-[var(--accent)] group-hover:border-[var(--accent)] transition-colors shrink-0">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] text-[var(--fg)]">{title}</span>
          <span className="block text-[12px] text-[var(--fg-mute)] mt-0.5">{desc}</span>
        </span>
        <ChevronRight size={14} className="text-[var(--fg-mute)] mt-1 shrink-0" />
      </Link>
    </li>
  );
}

function EmptyProjectsCard() {
  return (
    <div className="border border-dashed border-[var(--line-strong)] p-6 sm:p-8 text-center">
      <div className="t-eyebrow t-eyebrow-accent mb-2">Empty deck</div>
      <h3 className="t-display text-[clamp(1.25rem,3vw,1.75rem)] leading-[0.95] mb-2">
        First project on the house.
      </h3>
      <p className="t-prose text-[13px] mb-5 max-w-md mx-auto">
        Drop in iOS screenshots, pick devices and surfaces. Your first
        project takes about ninety seconds.
      </p>
      <Link
        href="/projects/new"
        className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-5 pr-1.5 py-2 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
      >
        <span className="btn-label">Start a project</span>
        <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform group-hover:translate-x-0.5 font-bold">→</span>
      </Link>
    </div>
  );
}
