"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, FolderGit2, Receipt, Settings, Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { BrandMark } from "@/components/Brand";
import { cn } from "@/lib/utils/cn";

const NAV: Array<{ href: string; label: string; icon: typeof LayoutGrid }> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/projects", label: "Projects", icon: FolderGit2 },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ creditBalance = 0, plan = "Free" }: { creditBalance?: number; plan?: string }) {
  const pathname = usePathname();
  const [collapsedMd, setCollapsedMd] = useState(true);
  const expandedMd = !collapsedMd;

  return (
    <aside
      className={cn(
        "flex flex-none flex-col border-r border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_96%,black)] transition-[width] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
        expandedMd ? "w-[72px] md:w-[248px]" : "w-[72px]",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-3">
        <Link href="/dashboard" className="min-w-0 flex items-center gap-2">
          <BrandMark size="sm" wordmark={expandedMd} className="text-[var(--fg)]" />
        </Link>
        <button
          type="button"
          onClick={() => setCollapsedMd(!collapsedMd)}
          className="hidden rounded-full border border-[var(--line)] bg-[var(--bg-3)] p-2 text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)] md:inline-flex"
          aria-label={collapsedMd ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={expandedMd}
        >
          {collapsedMd ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      <div className="p-3">
        <Link
          href="/projects/new"
          aria-label="New project"
          title={expandedMd ? undefined : "New project"}
          className={cn(
            "inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--accent)] text-[var(--accent-fg)] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-opacity hover:opacity-92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_35%,white)]",
          )}
        >
          <Plus size={15} strokeWidth={2.4} />
          {expandedMd && <span className="hidden md:inline">New project</span>}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3" aria-label="Primary">
        <div className="space-y-1">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href));
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                title={expandedMd ? undefined : n.label}
                className={cn(
                  "group relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13.5px] transition-colors",
                  active
                    ? "bg-[var(--bg-3)] text-[var(--fg)]"
                    : "text-[var(--fg-mute)] hover:bg-[var(--bg-2)] hover:text-[var(--fg)]",
                )}
              >
                {active && <span className="absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[var(--accent)]" aria-hidden />}
                <Icon size={16} className="flex-none" />
                {expandedMd && <span className="hidden md:inline">{n.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {expandedMd && (
        <div className="hidden border-t border-[var(--line)] p-3 md:block">
          <Link href="/billing" className="surface block p-4 transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--bg-3)]">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[12px] text-[var(--fg-mute)]">Credits</span>
              <span className="text-[12px] text-[var(--accent)]">{plan}</span>
            </div>
            <div className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--fg)] leading-none">
              {Number.isFinite(creditBalance) ? creditBalance.toLocaleString() : "∞"}
            </div>
            <div className="mt-2 text-[12px] text-[var(--fg-mute)]">Manage plan and top up</div>
          </Link>
        </div>
      )}
    </aside>
  );
}
