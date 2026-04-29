import Link from "next/link";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <div className="border-b border-[var(--line)]">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="block w-2.5 h-2.5 bg-[var(--accent)]" />
            <span className="t-display text-[18px] tracking-[-0.04em] leading-none normal-case">ShotsHQ</span>
            <sup className="t-mono-xs text-[var(--fg-mute)]">®</sup>
          </Link>
          <ThemeSwitcher compact />
        </div>
      </div>

      <main className="flex-1 grid grid-cols-12 relative overflow-hidden">
        <aside className="hidden lg:flex col-span-5 xl:col-span-6 border-r border-[var(--line)] p-12 flex-col justify-between bg-[var(--bg)] relative overflow-hidden">
          <div className="absolute inset-0 blueprint pointer-events-none" />
          <div className="relative z-10">
            <div className="t-eyebrow t-eyebrow-accent mb-3">Operator console</div>
            <h1 className="t-display text-[clamp(3rem,7vw,6.5rem)] leading-[0.88]">
              Enter<br />
              <span className="text-[var(--accent)]">console.</span>
            </h1>
          </div>
          <div className="relative z-10 max-w-md">
            <p className="t-prose">
              Sign in with Google, Apple, or email. Sessions are TLS 1.3
              with optional TOTP. We never sell or share account data.
            </p>
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-7 xl:col-span-6 flex items-center justify-center p-6 md:p-12">
          {children}
        </section>
      </main>
    </div>
  );
}
