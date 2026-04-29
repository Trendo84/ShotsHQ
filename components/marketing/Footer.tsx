"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COLS: Array<{ title: string; items: { label: string; href: string }[] }> = [
  {
    title: "Product",
    items: [
      { label: "Templates",  href: "/templates" },
      { label: "Pricing",    href: "/pricing" },
      { label: "Docs",       href: "/docs" },
      { label: "Changelog",  href: "/changelog" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Contact",   href: "/docs/contact" },
      { label: "Security",  href: "/docs/security" },
      { label: "Terms",     href: "/docs/terms" },
      { label: "Privacy",   href: "/docs/privacy" },
    ],
  },
];

export function MarketingFooter() {
  const [now, setNow] = useState("--:--");
  useEffect(() => {
    const tick = () => setNow(new Date().toISOString().slice(11, 16));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="border-t border-[var(--line-strong)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 pt-16 pb-8">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 md:col-span-6">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <span className="block w-2.5 h-2.5 bg-[var(--accent)]" />
              <span className="t-display text-[22px] tracking-[-0.04em] normal-case">ShotsHQ</span>
              <sup className="t-mono-xs text-[var(--fg-mute)]">®</sup>
            </Link>
            <p className="t-prose max-w-md">
              AI-powered App Store screenshots for indie iOS developers. Built
              for shipping, not design school.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title} className="col-span-6 md:col-span-3">
              <div className="t-eyebrow mb-4">{col.title}</div>
              <ul className="space-y-2.5">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-[14px] text-[var(--fg-dim)] hover:text-[var(--accent)] transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-5 border-t border-[var(--line)] grid grid-cols-12 gap-3 items-center text-[var(--fg-mute)]">
          <span className="col-span-12 md:col-span-6 t-eyebrow normal-case tracking-[0.06em] text-[12px]">
            © 2026 ShotsHQ™ — built in public
          </span>
          <span className="col-span-12 md:col-span-6 flex items-center gap-3 md:justify-end t-eyebrow normal-case tracking-[0.06em] text-[12px]">
            <span>v2.6</span>
            <span className="opacity-40">·</span>
            <span className="t-numeric">{now} UTC</span>
            <span className="opacity-40">·</span>
            <Link href="/docs/status" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <span className="block w-1.5 h-1.5 bg-[var(--signal)] pulse-soft" />
              <span className="text-[var(--signal)]">all systems</span>
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
