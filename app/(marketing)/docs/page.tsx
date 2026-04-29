import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Docs" };

const SECTIONS = [
  {
    title: "Getting started",
    code: "01",
    items: [
      { slug: "quickstart",  label: "Quickstart",        sub: "From signup to first export" },
      { slug: "concepts",    label: "Core concepts",     sub: "Projects, screenshots, credits" },
      { slug: "billing",     label: "Billing & credits", sub: "How the ledger works" },
    ],
  },
  {
    title: "Editor",
    code: "02",
    items: [
      { slug: "editor",       label: "Canvas editor",        sub: "Layers, frames, autosave" },
      { slug: "device-frames",label: "Device frames",        sub: "iPhone 6.9″, 6.7″, iPad 13″" },
      { slug: "export",       label: "Export pipeline",      sub: "Server render to all dimensions" },
    ],
  },
  {
    title: "AI modules",
    code: "03",
    items: [
      { slug: "ai-copy",      label: "AI copy generation",   sub: "Structured headline output" },
      { slug: "ai-backdrop",  label: "AI backdrop",          sub: "Subject lift + AI-generated background" },
      { slug: "translate",    label: "Translation",          sub: "41 locales, parallel fan-out" },
    ],
  },
  {
    title: "API & integrations",
    code: "04",
    items: [
      { slug: "api",          label: "Public API",           sub: "REST, webhooks, idempotency" },
      { slug: "asc",          label: "App Store Connect",    sub: "Direct upload integration" },
      { slug: "status",       label: "System status",        sub: "Live infrastructure metrics" },
    ],
  },
  {
    title: "Policy",
    code: "05",
    items: [
      { slug: "terms",        label: "Terms of service",     sub: "" },
      { slug: "privacy",      label: "Privacy policy",       sub: "" },
      { slug: "security",     label: "Security",             sub: "Data handling, retention" },
      { slug: "contact",      label: "Contact",              sub: "Support inbox + escalation" },
      { slug: "about",        label: "About",                sub: "Who builds ShotsHQ" },
    ],
  },
];

export default function DocsIndexPage() {
  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">
          <div className="grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 md:col-span-7">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Documentation</div>
              <h1 className="t-display text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[0.92] text-balance">
                Field manual.
              </h1>
            </div>
            <div className="col-span-12 md:col-span-5">
              <p className="t-prose-lg max-w-md">
                Short, fact-dense docs for every module in the pipeline.
                No marketing speak. All code samples copy-paste ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)]">
          {SECTIONS.map((section) => (
            <article key={section.title} className="bg-[var(--bg)] p-6 min-h-[260px]">
              <header className="flex items-start justify-between mb-4">
                <span className="t-eyebrow t-numeric">{section.code}</span>
                <span className="t-eyebrow text-[var(--fg-mute)]">{section.items.length} entries</span>
              </header>
              <h2 className="t-display text-[26px] leading-[0.95] mb-4 normal-case tracking-[-0.02em]">{section.title}</h2>
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/docs/${item.slug}`}
                      className="flex items-baseline justify-between gap-3 py-1.5 group"
                    >
                      <div>
                        <div className="text-[14px] text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors">{item.label}</div>
                        {item.sub && <div className="text-[12px] text-[var(--fg-mute)] mt-0.5">{item.sub}</div>}
                      </div>
                      <span className="text-[var(--fg-mute)] group-hover:text-[var(--accent)]">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
