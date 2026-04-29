"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/templates", label: "Templates" },
  { href: "/pricing",   label: "Pricing"   },
  { href: "/docs",      label: "Docs"      },
  { href: "/changelog", label: "Changelog" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // ESC closes mobile menu, route changes auto-close it.
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="border-b border-[var(--line)] bg-[var(--bg)]/95 sticky top-0 z-40 backdrop-blur-[6px]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-[var(--accent)] focus:text-[var(--accent-fg)] focus:px-3 focus:py-2 focus:t-eyebrow focus:no-underline"
      >
        Skip to content
      </a>

      <div className="grid grid-cols-12 items-stretch">
        <Link href="/" className="col-span-7 md:col-span-3 border-r border-[var(--line)] px-4 md:px-6 py-3 flex items-center gap-3 group">
          <span className="block w-2.5 h-2.5 bg-[var(--accent)] group-hover:animate-pulse" />
          <span className="t-display text-[clamp(1rem,4vw,1.25rem)] tracking-[-0.04em] leading-none">SHOTSHQ</span>
          <sup className="t-mono-xs text-[var(--fg-mute)] hidden sm:inline">®</sup>
        </Link>

        <nav className="hidden md:flex items-center col-span-6 px-6 gap-1">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative px-3 py-1.5 text-[13px] transition-colors rounded-none",
                  active ? "text-[var(--fg)]" : "text-[var(--fg-dim)] hover:text-[var(--fg)]",
                )}
              >
                {n.label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-3 right-3 -bottom-[2px] h-[3px] origin-left transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    active ? "bg-[var(--accent)] scale-x-100" : "bg-[var(--accent)] scale-x-0 group-hover:scale-x-50",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="col-span-5 md:col-span-3 flex items-center justify-end gap-2 px-3 py-2">
          <ThemeSwitcher compact className="hidden md:inline-flex" />
          <Link href="/sign-in" className="hidden md:inline-flex text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] px-3 py-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]">Sign in</Link>
          <Link href="/sign-up" className="btn btn-accent text-[11px] tracking-[0.06em] py-2 px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]">Start free</Link>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-[var(--fg)]" aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "md:hidden overflow-hidden transition-[max-height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] border-t border-[var(--line)]",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <div className="px-4 py-2">
          <ThemeSwitcher compact />
        </div>
        {NAV.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center justify-between border-t border-[var(--line)] px-4 py-3 text-[14px] hover:bg-[var(--bg-2)]",
                active ? "text-[var(--fg)]" : "text-[var(--fg-dim)]",
              )}
            >
              <span>{n.label}</span>
              {active && <span className="block w-1.5 h-1.5 bg-[var(--accent)]" aria-hidden />}
            </Link>
          );
        })}
        <Link href="/sign-in" onClick={() => setOpen(false)} className="block border-t border-[var(--line)] px-4 py-3 text-[14px] text-[var(--fg-mute)]">
          Sign in
        </Link>
      </div>
    </header>
  );
}
