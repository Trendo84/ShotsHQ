import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md">
      <div className="t-mono-xs text-[var(--accent)] mb-2">[ AUTH / SIGN-UP ]</div>
      <h2 className="t-display text-[42px] leading-[0.9] mb-2">CREATE<br />OPERATOR</h2>
      <p className="t-mono-xs text-[var(--fg-mute)] mb-6">
        FREE FOREVER · NO CARD REQUIRED · WATERMARK ON FREE EXPORTS
      </p>
      <div className="border border-[var(--line-strong)] bg-[var(--bg)] p-1 shadow-[6px_6px_0_var(--accent)]">
        {HAS_CLERK ? (
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                footerAction: "t-mono-xs",
              },
            }}
          />
        ) : (
          <div className="p-6 space-y-4">
            <div className="t-mono-xs text-[var(--accent)]">[ AUTH / NOT CONFIGURED ]</div>
            <p className="t-mono-sm text-[var(--fg-dim)] leading-relaxed">
              CLERK PUBLISHABLE KEY NOT FOUND. SET <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
              IN <code>.env.local</code> TO ENABLE SIGN-UP.
            </p>
            <Link href="/dashboard" className="btn btn-accent w-full">
              BROWSE APP IN PREVIEW MODE &gt;&gt;
            </Link>
            <Link href="/" className="t-mono-xs text-[var(--fg-mute)] hover:text-[var(--accent)] block">← BACK TO MARKETING</Link>
          </div>
        )}
      </div>
    </div>
  );
}
