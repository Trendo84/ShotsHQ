import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <div className="text-center max-w-2xl">
        <div className="t-eyebrow t-eyebrow-accent mb-4">Error 404</div>
        <h1 className="t-display text-[clamp(2.75rem,9vw,6rem)] tracking-[-0.05em] leading-[0.88] text-balance">
          Page not<br />
          <span className="text-[var(--accent)]">in manifest.</span>
        </h1>
        <p className="t-prose-lg mt-6 max-w-md mx-auto">
          The route you were looking for has been deprecated, repositioned,
          or never existed. No data was harmed.
        </p>
        <div className="hazard h-1.5 my-8" aria-hidden />
        <div className="flex justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-5 pr-1.5 py-2 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
          >
            <span className="btn-label">Return home</span>
            <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 font-bold">
              →
            </span>
          </Link>
          <Link href="/docs" className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--accent)] px-2 py-2">
            Browse docs
          </Link>
        </div>
      </div>
    </div>
  );
}
