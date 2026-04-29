import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight } from "lucide-react";
import { getOrCreateDbUser } from "@/lib/auth/clerk";

const PROJECTS = [
  { id: "p_01", name: "Tideline",    category: "Surf reports",      updated: "10:14 today",  screenshots: 8,  status: "READY" },
  { id: "p_02", name: "FocusForge",  category: "Productivity",      updated: "yesterday",    screenshots: 24, status: "RENDERING" },
  { id: "p_03", name: "Lentil",      category: "Grocery inventory", updated: "6 days ago",   screenshots: 5,  status: "DRAFT" },
  { id: "p_04", name: "Sundial",     category: "Habit tracker",     updated: "9 days ago",   screenshots: 16, status: "READY" },
];

const ACTIVITY = [
  { ts: "10:14", level: "info", body: "Copy generation completed for Tideline (en)" },
  { ts: "10:13", level: "warn", body: "fal.ai latency 312 ms (above 200 ms p50 target)" },
  { ts: "10:11", level: "info", body: "Render rndr_42d8 succeeded — sharp 3.1 s, R2 0.8 s" },
  { ts: "10:09", level: "err",  body: "Restyle failed (model overload), credits refunded" },
  { ts: "10:08", level: "info", body: "Stripe meter ai_generation × 1 — cus_OG" },
  { ts: "10:05", level: "info", body: "Polotno autosave OK (4.2 KB diff)" },
];

export default async function DashboardPage() {
  // Eager-sync the Clerk user into Postgres on every dashboard hit.
  // Idempotent by clerkId; cheap when the row already exists.
  await getOrCreateDbUser();

  return (
    <>
      <Topbar section="Dashboard" breadcrumb={["Operator", "Overview"]} />

      <div className="px-6 lg:px-10 py-10 max-w-[1480px]">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <div className="t-eyebrow t-eyebrow-accent mb-2">Welcome back</div>
            <h1 className="t-display text-[clamp(2rem,4vw,3.5rem)]">
              Today's queue.
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href="/projects/new" className="btn btn-accent"><Plus size={13} /> New project</Link>
            <Link href="/billing" className="btn">Top-up credits</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] mb-12">
          <Stat label="Credits"     value="142"    sub="58 used this month" tint="accent" />
          <Stat label="Exports"     value="247"    sub="this month"         />
          <Stat label="In queue"    value="03"     sub="rendering"          />
          <Stat label="Render P50"  value="3.2s"   sub="last 24h"           tint="signal" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <section className="xl:col-span-2">
            <header className="flex items-center justify-between mb-3">
              <h2 className="t-eyebrow">Projects</h2>
              <Link href="/projects" className="text-[13px] text-[var(--fg-mute)] hover:text-[var(--fg)]">View all →</Link>
            </header>
            <ul className="border border-[var(--line)]">
              {PROJECTS.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="grid grid-cols-12 items-center gap-3 px-4 py-4 border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--bg-2)] transition-colors"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <div className="t-display text-[20px] leading-tight normal-case tracking-[-0.02em]">{p.name}</div>
                      <div className="text-[13px] text-[var(--fg-mute)] mt-0.5">{p.category}</div>
                    </div>
                    <div className="col-span-6 sm:col-span-3 text-[13px] text-[var(--fg-mute)]">{p.updated}</div>
                    <div className="col-span-3 sm:col-span-2 text-[13px] text-[var(--fg)] t-numeric">{p.screenshots} shots</div>
                    <div className="col-span-3 sm:col-span-2 flex justify-end items-center gap-2">
                      <StatusBadge status={p.status} />
                      <ChevronRight size={14} className="text-[var(--fg-mute)]" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <header className="flex items-center justify-between mb-3">
              <h2 className="t-eyebrow">Activity</h2>
              <span className="t-eyebrow text-[var(--signal)]">● Live</span>
            </header>
            <ul className="border border-[var(--line)]">
              {ACTIVITY.map((a, i) => (
                <li key={i} className="px-4 py-2.5 border-b border-[var(--line)] last:border-b-0 grid grid-cols-[44px_36px_1fr] gap-2 items-baseline">
                  <span className="text-[12px] text-[var(--fg-mute)] t-numeric">{a.ts}</span>
                  <span className={
                    a.level === "err"  ? "t-eyebrow text-[var(--accent)]"   :
                    a.level === "warn" ? "t-eyebrow text-[#FFC233]"          :
                    "t-eyebrow text-[var(--signal)]"
                  }>
                    {a.level}
                  </span>
                  <span className="text-[12.5px] text-[var(--fg-dim)] leading-snug">{a.body}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, sub, tint = "default" }: { label: string; value: string; sub?: string; tint?: "default" | "accent" | "signal" }) {
  const color =
    tint === "accent" ? "text-[var(--accent)]"
    : tint === "signal" ? "text-[var(--signal)]"
    : "text-[var(--fg)]";
  return (
    <div className="bg-[var(--bg)] p-5">
      <div className="t-eyebrow">{label}</div>
      <div className={`t-display text-[clamp(2rem,4vw,2.75rem)] leading-[0.9] mt-2 t-numeric ${color}`}>{value}</div>
      {sub && <div className="text-[12px] text-[var(--fg-mute)] mt-2">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "READY")     return <Badge variant="live">Ready</Badge>;
  if (status === "RENDERING") return <Badge variant="warn">Rendering</Badge>;
  return <Badge>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>;
}
