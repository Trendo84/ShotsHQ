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
            <p className="t-prose max-w-md mb-5">
              AI-powered App Store screenshots for indie iOS developers. Built
              for shipping, not design school.
            </p>
            {/* Social — built in public means people can find the builder */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/Trendo84/ShotsHQ"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ShotsHQ on GitHub"
                className="inline-grid place-items-center w-9 h-9 border border-[var(--line-strong)] text-[var(--fg-dim)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
              >
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden>
                  <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.7-.01-1.36-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </a>
              <Link
                href="/changelog"
                aria-label="ShotsHQ changelog"
                className="inline-grid place-items-center w-9 h-9 border border-[var(--line-strong)] text-[var(--fg-dim)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors t-mono-xs"
                title="Build log"
              >
                LOG
              </Link>
              <a
                href="mailto:hello@shotshq.com"
                aria-label="Email the builder"
                className="inline-grid place-items-center w-9 h-9 border border-[var(--line-strong)] text-[var(--fg-dim)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden>
                  <rect x="3" y="5" width="18" height="14" />
                  <path d="M3 7 L12 13 L21 7" />
                </svg>
              </a>
            </div>
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
            <span className="text-[var(--fg-mute)]">Server time</span>
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
