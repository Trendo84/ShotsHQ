import { Topbar } from "@/components/app/Topbar";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/clerk";
import {
  AscForm,
  ProfileForm,
  StudioApiForm,
} from "@/components/settings/SettingsForms";

/**
 * SECTIONS — recovery-cycle redesign 2026-05-24.
 *
 * Was a 4-entry list with `code: "01"` prefixes that rendered as
 * "01 · Section" / "02 · Section" / etc. on the page — internal-tool
 * framing. Now: just `title` + `description`. The section header
 * renders the title as a clean h2 with a quiet kicker line; no more
 * numbered scaffolding for the user to count through.
 */
const SECTIONS = [
  {
    title:       "Profile",
    description: "How you show up on receipts and (later) the public showcase.",
  },
  {
    title:       "Studio API",
    description: "Public REST + webhooks. Included with Studio and Lifetime — shipping in v1.1.",
  },
  {
    title:       "App Store Connect",
    description: "Direct push of generated assets to App Store Connect — shipping in v1.1.",
  },
  {
    title:       "Account",
    description: "Export or delete your data. Email support today; self-serve in v1.1.",
  },
] as const;

function SectionHeading({
  title, description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="col-span-12 md:col-span-4 md:pr-8">
      <h2 className="text-[20px] font-semibold tracking-[-0.015em] text-[var(--fg)] leading-snug mb-2">
        {title}
      </h2>
      <p className="text-[13.5px] text-[var(--fg-dim)] max-w-xs leading-relaxed">{description}</p>
    </div>
  );
}

export default async function SettingsPage() {
  const user      = await requireUser();
  const isStudio  = user.plan === "studio_monthly" || user.plan === "studio_annual" || user.plan === "lifetime";
  // Synthetic default for users who never set a custom handle: the
  // local part of the email, lowercased + cleaned. Suggested only in
  // the placeholder; never persisted unless the user actually saves.
  const handleSeed = (user.email.split("@")[0] ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 30);

  return (
    <>
      <Topbar section="Settings" breadcrumb={["Settings"]} />

      <div className="px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12 pb-6 lg:pb-8 max-w-[1480px] border-b border-[var(--line)]">
        <div className="grid grid-cols-12 gap-6 lg:gap-8 items-end">
          <div className="col-span-12 md:col-span-7">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-2">
              Account
            </div>
            <h1 className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.02em] text-[var(--fg)] leading-tight">
              Account settings
            </h1>
          </div>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md text-[var(--fg)]">
            Profile changes save to Postgres in under a second. Studio
            API and App Store Connect integrations ship in v1.1.
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 max-w-[1480px] divide-y divide-[var(--line)]">

        {/* Profile */}
        <section
          className="grid grid-cols-12 gap-6 lg:gap-8 py-10 lg:py-12"
          data-settings-section="profile"
        >
          <SectionHeading {...SECTIONS[0]!} />
          <div className="col-span-12 md:col-span-8 max-w-2xl">
            <ProfileForm
              email={user.email}
              initial={{
                displayName: user.displayName,
                // Seed the input with the handle the user actually
                // stored — never the synthetic email-local-part guess.
                // The placeholder still shows the seed so users have a
                // suggestion to lift verbatim.
                handle:      user.handle,
                bio:         user.bio,
              }}
            />
            <p className="t-mono-xs text-[var(--fg-mute)] mt-4">
              ▸ Suggested handle: <code>{handleSeed || "your-handle"}</code>
            </p>
          </div>
        </section>

        {/* Studio API */}
        <section
          className="grid grid-cols-12 gap-6 lg:gap-8 py-10 lg:py-12"
          data-settings-section="api"
        >
          <SectionHeading {...SECTIONS[1]!} />
          <div className="col-span-12 md:col-span-8 max-w-2xl">
            <StudioApiForm enabled={isStudio} />
          </div>
        </section>

        {/* App Store Connect */}
        <section
          className="grid grid-cols-12 gap-6 lg:gap-8 py-10 lg:py-12"
          data-settings-section="asc"
        >
          <SectionHeading {...SECTIONS[2]!} />
          <div className="col-span-12 md:col-span-8 max-w-2xl">
            <AscForm />
          </div>
        </section>

        {/*
          Danger zone — both actions are NOT yet wired to back-end
          flows. Audit P2-10 flagged the un-disabled Delete/Export
          buttons as the highest-risk dead controls in the app: an
          operator could click "Delete" expecting a destructive action,
          and our doing nothing is worse than disclosing that the flow
          isn't ready. Disabling + honest "soon" copy + a documented
          email fallback for users who genuinely need data export
          today.
        */}
        <section
          className="grid grid-cols-12 gap-6 lg:gap-8 py-10 lg:py-12"
          data-settings-section="danger"
        >
          <SectionHeading {...SECTIONS[3]!} />
          <div className="col-span-12 md:col-span-8 max-w-2xl">
            {/*
              Danger-zone treatment toned down to plain `--line` borders
              (was `--accent`) so the page doesn't end on a fire-warning
              note while self-serve export + delete are still v1.1.
              When the flows ship and the buttons are actually live,
              re-promote the Delete card border to `--accent` to mark
              the destructive action.
            */}
            <div className="border border-[var(--line)] divide-y divide-[var(--line)]">
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-[var(--fg)]">Export all data</div>
                  <div className="text-[12px] text-[var(--fg-dim)] mt-1">
                    JSON archive of projects, exports, and ledger. Email{" "}
                    <a href="mailto:support@shotshq.com" className="text-[var(--fg-dim)] hover:text-[var(--accent)] underline">support@shotshq.com</a>{" "}
                    today; self-serve ships in v1.1.
                  </div>
                </div>
                <Button
                  variant="ghost"
                  disabled
                  title="Self-serve export · coming soon"
                  aria-label="Request data export — self-serve flow coming soon"
                  className="text-[11px] tracking-[0.04em] normal-case shrink-0 opacity-50 cursor-not-allowed"
                >
                  Export · soon
                </Button>
              </div>
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-[var(--fg)]">Delete account</div>
                  <div className="text-[12px] text-[var(--fg-dim)] mt-1">
                    Removes all projects, exports, and ledger entries. To
                    delete now, email{" "}
                    <a href="mailto:support@shotshq.com" className="text-[var(--fg-dim)] hover:text-[var(--accent)] underline">support@shotshq.com</a>{" "}
                    from your account email. Self-serve confirmation
                    ships in v1.1.
                  </div>
                </div>
                <Button
                  variant="ghost"
                  disabled
                  title="Self-serve delete · coming soon (email support to delete now)"
                  aria-label="Delete account — self-serve flow coming soon, email support to delete now"
                  className="text-[11px] tracking-[0.04em] normal-case shrink-0 opacity-50 cursor-not-allowed"
                >
                  Delete · soon
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
