"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
  LayoutGrid,
  FolderGit2,
  Receipt,
  Settings,
  Plus,
} from "lucide-react";

const NAV: Array<{ href: string; label: string; icon: typeof LayoutGrid }> = [
  { href: "/dashboard",  label: "Dashboard", icon: LayoutGrid  },
  { href: "/projects",   label: "Projects",  icon: FolderGit2  },
  { href: "/billing",    label: "Billing",   icon: Receipt     },
  { href: "/settings",   label: "Settings",  icon: Settings    },
];

export function Sidebar({ creditBalance = 0, plan = "Free" }: { creditBalance?: number; plan?: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      className={cn(
        "border-r border-[var(--line)] bg-[var(--bg)] flex flex-col transition-[width] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
        collapsed ? "w-[60px]" : "w-[240px]",
      )}
    >
      <div className="border-b border-[var(--line)] p-3 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <span className="block w-2 h-2 bg-[var(--accent)] flex-none" />
          {!collapsed && (
            <span className="t-display text-[16px] tracking-[-0.04em] truncate normal-case">ShotsHQ</span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="t-mono-xs text-[var(--fg-mute)] hover:text-[var(--accent)] transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {!collapsed && (
        <Link
          href="/projects/new"
          className="m-3 inline-flex items-center justify-center gap-2 bg-[var(--accent)] text-[var(--accent-fg)] py-2.5 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-fg)]"
        >
          <Plus size={14} strokeWidth={2.75} />
          <span className="btn-label-sm">New project</span>
        </Link>
      )}

      <nav className="flex-1 overflow-y-auto" aria-label="Primary">
        {NAV.map((n) => {
          const active = pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href));
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 text-[13px] border-b border-[var(--line)] transition-colors",
                active
                  ? "text-[var(--fg)] bg-[var(--bg-2)] font-medium"
                  : "text-[var(--fg-mute)] hover:text-[var(--fg)] hover:bg-[var(--bg-2)]",
              )}
            >
              {active && (
                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent)]" aria-hidden />
              )}
              <Icon size={14} className="flex-none" />
              {!collapsed && <span className="flex-1">{n.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-[var(--line)] p-3 space-y-3">
          <Link href="/billing" className="block border border-[var(--line)] bg-[var(--bg-2)] p-3 hover:border-[var(--accent)] transition-colors group">
            <div className="flex items-center justify-between">
              <span className="t-eyebrow">Credits</span>
              <span className="text-[11px] text-[var(--accent)]">{plan}</span>
            </div>
            <div className="t-display text-[28px] leading-tight mt-1 t-numeric">
              {Number.isFinite(creditBalance) ? creditBalance.toLocaleString() : "∞"}
            </div>
            <div className="text-[11px] text-[var(--fg-mute)] mt-1 group-hover:text-[var(--fg-dim)] transition-colors">
              Tap to top up →
            </div>
          </Link>
          <div className="flex items-center justify-between text-[11px] text-[var(--fg-mute)]">
            <span>v2.6</span>
            <span className="flex items-center gap-1.5">
              <span className="block w-1.5 h-1.5 rounded-full bg-[var(--signal)] pulse-soft" />
              <span className="text-[var(--signal)]">Online</span>
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
