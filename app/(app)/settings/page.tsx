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
    title: "Profile",
    description: "How you appear on receipts today and on the public showcase later.",
  },
  {
    title: "Studio API",
    description: "REST + webhooks for teams shipping at a higher cadence. Planned for v1.1.",
  },
  {
    title: "App Store Connect",
    description: "Direct delivery into App Store Connect when the integration ships in v1.1.",
  },
  {
    title: "Account",
    description: "Export or delete your data. Support can help today; self-serve follows next.",
  },
] as const;

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--fg)] leading-snug">
        {title}
      </h2>
      <p className="mt-2 max-w-[28ch] text-[14px] leading-[1.6] text-[var(--fg-dim)]">
        {description}
      </p>
    </div>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const isStudio = user.plan === "studio_monthly" || user.plan === "studio_annual" || user.plan === "lifetime";
  const handleSeed = (user.email.split("@")[0] ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 30);

  return (
    <>
      <Topbar section="Settings" />

      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 lg:mb-10">
          <p className="mb-2 text-[13px] text-[var(--fg-mute)]">Preferences and account</p>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.04em] text-[var(--fg)] leading-[1.02]">
            Account settings
          </h1>
          <p className="mt-4 max-w-[58ch] text-[15px] leading-[1.7] text-[var(--fg-dim)]">
            Keep your profile current, check what ships with your plan, and see which integrations are already live versus still on the roadmap.
          </p>
        </div>

        <div className="space-y-5">
          <section className="surface p-6 sm:p-7" data-settings-section="profile">
            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
              <SectionHeader {...SECTIONS[0]} />
              <div className="min-w-0">
                <ProfileForm
                  email={user.email}
                  initial={{
                    displayName: user.displayName,
                    handle: user.handle,
                    bio: user.bio,
                  }}
                />
                <p className="mt-4 text-[13px] text-[var(--fg-mute)]">
                  Suggested handle: <code className="rounded bg-[var(--bg-3)] px-1.5 py-0.5 text-[12px] text-[var(--fg-dim)]">{handleSeed || "your-handle"}</code>
                </p>
              </div>
            </div>
          </section>

          <section className="surface p-6 sm:p-7" data-settings-section="api">
            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
              <SectionHeader {...SECTIONS[1]} />
              <div className="min-w-0">
                <StudioApiForm enabled={isStudio} />
              </div>
            </div>
          </section>

          <section className="surface p-6 sm:p-7" data-settings-section="asc">
            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
              <SectionHeader {...SECTIONS[2]} />
              <div className="min-w-0">
                <AscForm />
              </div>
            </div>
          </section>

          <section className="surface p-6 sm:p-7" data-settings-section="danger">
            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
              <SectionHeader {...SECTIONS[3]} />
              <div className="min-w-0 space-y-4">
                <div className="surface-raised p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[16px] font-medium text-[var(--fg)]">Export all data</div>
                      <div className="mt-2 max-w-[56ch] text-[13.5px] leading-[1.6] text-[var(--fg-dim)]">
                        Download a JSON archive of projects, exports, and ledger activity. For now, email <a href="mailto:support@shotshq.com" className="underline decoration-[var(--line-strong)] underline-offset-4 hover:text-[var(--fg)]">support@shotshq.com</a> and we&apos;ll handle it manually.
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      disabled
                      title="Self-serve export — coming soon"
                      aria-label="Request data export — self-serve flow coming soon"
                      className="shrink-0 opacity-50 cursor-not-allowed"
                    >
                      Export soon
                    </Button>
                  </div>
                </div>

                <div className="surface-raised p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[16px] font-medium text-[var(--fg)]">Delete account</div>
                      <div className="mt-2 max-w-[56ch] text-[13.5px] leading-[1.6] text-[var(--fg-dim)]">
                        This removes projects, exports, and billing history associated with the account. Until the self-serve flow ships, email <a href="mailto:support@shotshq.com" className="underline decoration-[var(--line-strong)] underline-offset-4 hover:text-[var(--fg)]">support@shotshq.com</a> from your account email.
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      disabled
                      title="Self-serve delete — coming soon"
                      aria-label="Delete account — self-serve flow coming soon"
                      className="shrink-0 opacity-50 cursor-not-allowed"
                    >
                      Delete soon
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
