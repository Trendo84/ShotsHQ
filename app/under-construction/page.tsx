import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CONSTRUCTION_COOKIE,
  CONSTRUCTION_COOKIE_VALUE,
  CONSTRUCTION_PASS,
} from "@/lib/construction";

export const metadata: Metadata = {
  title: "ShotsHQ is under construction",
  description: "ShotsHQ is temporarily closed while the next version is being prepared.",
  robots: {
    index: false,
    follow: false,
  },
};

async function unlock(formData: FormData) {
  "use server";

  const pass = String(formData.get("pass") ?? "").trim();

  if (pass !== CONSTRUCTION_PASS) {
    redirect("/under-construction?error=1");
  }

  const next = String(formData.get("next") ?? "/");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const cookieStore = await cookies();
  cookieStore.set({
    name: CONSTRUCTION_COOKIE,
    value: CONSTRUCTION_COOKIE_VALUE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(safeNext);
}

export default async function UnderConstructionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "1";
  const next = params.next?.startsWith("/") && !params.next.startsWith("//")
    ? params.next
    : "/";

  return (
    <main className="min-h-dvh grid place-items-center px-4 py-16 bg-[var(--bg)] text-[var(--fg)] relative overflow-hidden">
      <div className="absolute inset-0 blueprint opacity-70 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-[var(--accent)]" />
      <section className="relative z-10 w-full max-w-[620px] border border-[var(--line-strong)] bg-[var(--bg)] shadow-[10px_10px_0_var(--accent)]">
        <div className="border-b border-[var(--line)] px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="block w-2.5 h-2.5 bg-[var(--accent)]" />
            <span className="t-display text-[18px] tracking-[-0.04em] leading-none normal-case">
              Shots<span className="text-[var(--accent)]">HQ</span>
            </span>
          </div>
          <span className="t-mono-xs text-[var(--fg-mute)]">Private build</span>
        </div>

        <div className="p-6 md:p-8">
          <p className="t-eyebrow t-eyebrow-accent mb-3">Under construction</p>
          <h1 className="t-display text-[clamp(2.5rem,9vw,5.5rem)] leading-[0.86] tracking-[-0.05em] text-balance">
            Building the sharper version.
          </h1>
          <p className="t-prose-lg mt-5 max-w-[44ch]">
            The public site is temporarily closed while the next ShotsHQ pass is
            prepared. Enter the access pass to continue.
          </p>

          <form action={unlock} className="mt-8 grid gap-3">
            <input type="hidden" name="next" value={next} />
            <label htmlFor="pass" className="t-mono-xs text-[var(--fg-mute)]">
              Access pass
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
              <input
                id="pass"
                name="pass"
                type="password"
                autoComplete="current-password"
                required
                className="h-12 border border-[var(--line-strong)] bg-[var(--bg-2)] px-4 font-mono text-[14px] text-[var(--fg)] outline-none focus:border-[var(--accent)]"
                aria-invalid={hasError}
                aria-describedby={hasError ? "pass-error" : undefined}
              />
              <button
                type="submit"
                className="h-12 border border-[var(--accent)] bg-[var(--accent)] px-5 t-mono-sm text-[var(--accent-fg)] hover:bg-[var(--bg)] hover:text-[var(--accent)] transition-colors"
              >
                Enter
              </button>
            </div>
            {hasError ? (
              <p id="pass-error" className="t-mono-xs text-[var(--accent)]">
                Wrong pass. Try again.
              </p>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  );
}
