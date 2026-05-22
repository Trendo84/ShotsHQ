import { Topbar } from "@/components/app/Topbar";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/clerk";
import {
  AscForm,
  ProfileForm,
  StudioApiForm,
} from "@/components/settings/SettingsForms";

const SECTIONS = [
  {
    code:        "01",
    title:       "Profile",
    description: "Displayed on operator cards, receipts, and the public showcase.",
  },
  {
    code:        "02",
    title:       "Studio API",
    description: "Studio + Lifetime plan. Rotate any time.",
  },
  {
    code:        "03",
    title:       "App Store Connect",
    description: "Enable direct push of generated assets.",
  },
  {
    code:        "04",
    title:       "Danger zone",
    description: "Operations that cannot be undone.",
    danger:      true,
  },
] as const;

function SectionHeading({
  code, title, description, danger = false,
}: {
  code: string;
  title: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <div className="col-span-12 md:col-span-4 md:pr-8">
      <div className={`t-eyebrow ${danger ? "text-[var(--accent)]" : "t-eyebrow-accent"} mb-3`}>
        {code} · {danger ? "Caution" : "Section"}
      </div>
      <h2
        className={`t-display text-[clamp(1.5rem,2.6vw,1.875rem)] leading-[0.95] mb-3 normal-case tracking-[-0.02em] text-balance ${
          danger ? "text-[var(--accent)]" : ""
        }`}
      >
        {title}
      </h2>
      <p className="t-prose text-[14px] max-w-xs">{description}</p>
    </div>
  );
}

export default async function SettingsPage() {
  const user      = await requireUser();
  const isStudio  = user.plan === "studio_monthly" || user.plan === "studio_annual" || user.plan === "lifetime";
  const handle    = user.email.split("@")[0] ?? "";

  return (
    <>
      <Topbar section="Settings" breadcrumb={["Operator", "Settings"]} />

      <div className="px-4 sm:px-6 lg:px-10 pt-10 lg:pt-12 pb-8 lg:pb-10 max-w-[1480px] border-b border-[var(--line)]">
        <div className="grid grid-cols-12 gap-6 lg:gap-8 items-end">
          <div className="col-span-12 md:col-span-7">
            <div className="t-eyebrow t-eyebrow-accent mb-3">Account</div>
            <h1 className="t-display text-[clamp(2rem,4vw,3.75rem)] leading-[0.95] normal-case tracking-[-0.04em] text-balance">
              Operator config.
            </h1>
          </div>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md">
            Changes persist within five seconds. API keys are encrypted at
            rest with AES-256.
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 max-w-[1480px] divide-y divide-[var(--line)]">

        {/* Profile */}
        <section className="grid grid-cols-12 gap-6 lg:gap-8 py-10 lg:py-12">
          <SectionHeading {...SECTIONS[0]!} />
          <div className="col-span-12 md:col-span-8 max-w-2xl">
            <ProfileForm email={user.email} handle={handle} />
          </div>
        </section>

        {/* Studio API */}
        <section className="grid grid-cols-12 gap-6 lg:gap-8 py-10 lg:py-12">
          <SectionHeading {...SECTIONS[1]!} />
          <div className="col-span-12 md:col-span-8 max-w-2xl">
            <StudioApiForm enabled={isStudio} />
          </div>
        </section>

        {/* App Store Connect */}
        <section className="grid grid-cols-12 gap-6 lg:gap-8 py-10 lg:py-12">
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
        <section className="grid grid-cols-12 gap-6 lg:gap-8 py-10 lg:py-12">
          <SectionHeading {...SECTIONS[3]!} />
          <div className="col-span-12 md:col-span-8 space-y-4 max-w-2xl">
            <div className="border border-[var(--accent)] p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-[var(--fg)]">Export all data</div>
                <div className="text-[12px] text-[var(--fg-mute)] mt-1">
                  JSON archive — projects, exports, ledger.
                  <br />
                  Self-serve export ships in v1.1. Need it today? Email{" "}
                  <a href="mailto:support@shotshq.com" className="text-[var(--fg-dim)] hover:text-[var(--accent)] underline">support@shotshq.com</a>.
                </div>
              </div>
              <Button
                variant="ghost"
                disabled
                title="Self-serve export · coming soon"
                aria-label="Request data export — self-serve flow coming soon"
                className="text-[11px] tracking-[0.04em] normal-case shrink-0 opacity-50 cursor-not-allowed"
              >
                Request export · soon
              </Button>
            </div>
            <div className="border border-[var(--accent)] p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-[var(--accent)]">Delete account</div>
                <div className="text-[12px] text-[var(--fg-mute)] mt-1">
                  Removes all projects, exports, ledger. Irreversible.
                  <br />
                  Self-serve deletion ships with a two-step confirmation in v1.1. To delete now, email{" "}
                  <a href="mailto:support@shotshq.com" className="text-[var(--fg-dim)] hover:text-[var(--accent)] underline">support@shotshq.com</a>{" "}
                  from your account email.
                </div>
              </div>
              <Button
                variant="destructive"
                disabled
                title="Self-serve delete · coming soon (email support to delete now)"
                aria-label="Delete account — self-serve flow coming soon, email support to delete now"
                className="text-[11px] tracking-[0.04em] normal-case shrink-0 opacity-50 cursor-not-allowed"
              >
                Delete · soon
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
