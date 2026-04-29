import { Topbar } from "@/components/app/Topbar";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  {
    code: "01",
    title: "Profile",
    description: "Displayed on operator cards, receipts, and the public showcase.",
  },
  {
    code: "02",
    title: "Studio API",
    description: "Studio + Lifetime plan. Rotate any time.",
  },
  {
    code: "03",
    title: "App Store Connect",
    description: "Enable direct push of generated assets.",
  },
  {
    code: "04",
    title: "Danger zone",
    description: "Operations that cannot be undone.",
    danger: true,
  },
];

function SectionHeading({ code, title, description, danger = false }: typeof SECTIONS[number] & { danger?: boolean }) {
  return (
    <div className="col-span-12 md:col-span-4 md:pr-8">
      <div className={`t-eyebrow ${danger ? "text-[var(--accent)]" : "t-eyebrow-accent"} mb-3`}>
        {code} · {danger ? "Caution" : "Section"}
      </div>
      <h2 className={`t-display text-[28px] leading-[0.95] mb-3 normal-case tracking-[-0.02em] ${danger ? "text-[var(--accent)]" : ""}`}>
        {title}
      </h2>
      <p className="t-prose text-[14px] max-w-xs">{description}</p>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <Topbar section="Settings" breadcrumb={["Operator", "Settings"]} />

      <div className="px-6 lg:px-10 pt-12 pb-10 max-w-[1480px] border-b border-[var(--line)]">
        <div className="grid grid-cols-12 gap-8 items-end">
          <div className="col-span-12 md:col-span-7">
            <div className="t-eyebrow t-eyebrow-accent mb-3">Account</div>
            <h1 className="t-display text-[clamp(2.25rem,4vw,3.75rem)] normal-case tracking-[-0.04em]">
              Operator config.
            </h1>
          </div>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md">
            Changes persist within five seconds. API keys are encrypted at
            rest with AES-256.
          </p>
        </div>
      </div>

      <div className="px-6 lg:px-10 max-w-[1480px] divide-y divide-[var(--line)]">
        {/* Profile */}
        <section className="grid grid-cols-12 gap-8 py-12">
          <SectionHeading {...SECTIONS[0]!} />
          <div className="col-span-12 md:col-span-8 space-y-5 max-w-2xl">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Display name</Label>
                <Input placeholder="K. Arnesen" defaultValue="K. Arnesen" />
              </div>
              <div>
                <Label>Handle</Label>
                <Input placeholder="@arnesendev" defaultValue="@arnesendev" />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" defaultValue="ivansajtovi@gmail.com" />
            </div>
            <div>
              <Label>Bio (public)</Label>
              <Textarea rows={3} defaultValue="Solo iOS dev. Ships small focused tools." />
            </div>
            <div className="pt-1">
              <Button variant="accent" className="text-[12px] tracking-[0.04em] normal-case">Save profile</Button>
            </div>
          </div>
        </section>

        {/* Studio API */}
        <section className="grid grid-cols-12 gap-8 py-12">
          <SectionHeading {...SECTIONS[1]!} />
          <div className="col-span-12 md:col-span-8 space-y-4 max-w-2xl">
            <div>
              <Label>API key</Label>
              <div className="flex gap-2">
                <Input readOnly defaultValue="sk_live_••••••••••••••••••••••••H7L2" />
                <Button variant="ghost" className="text-[11px] tracking-[0.04em] normal-case">Copy</Button>
                <Button variant="destructive" className="text-[11px] tracking-[0.04em] normal-case">Rotate</Button>
              </div>
            </div>
            <div>
              <Label>Webhook URL</Label>
              <Input placeholder="https://your.app/webhooks/shotshq" />
            </div>
            <div>
              <Label>Webhook secret</Label>
              <Input readOnly defaultValue="whsec_••••••••••••••••••••••5XQp" />
            </div>
          </div>
        </section>

        {/* App Store Connect */}
        <section className="grid grid-cols-12 gap-8 py-12">
          <SectionHeading {...SECTIONS[2]!} />
          <div className="col-span-12 md:col-span-8 space-y-4 max-w-2xl">
            <div>
              <Label>Issuer ID</Label>
              <Input placeholder="69a6de7d-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </div>
            <div>
              <Label>Key ID</Label>
              <Input placeholder="2X9YABCDEFG" />
            </div>
            <div>
              <Label>Private key (.p8)</Label>
              <Textarea rows={6} placeholder="-----BEGIN PRIVATE KEY-----..." />
            </div>
            <div className="pt-1">
              <Button variant="accent" className="text-[12px] tracking-[0.04em] normal-case">Verify and save</Button>
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section className="grid grid-cols-12 gap-8 py-12">
          <SectionHeading {...SECTIONS[3]!} danger />
          <div className="col-span-12 md:col-span-8 space-y-4 max-w-2xl">
            <div className="border border-[var(--accent)] p-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-[14px] font-medium text-[var(--fg)]">Export all data</div>
                <div className="text-[12px] text-[var(--fg-mute)] mt-1">JSON archive — projects, exports, ledger.</div>
              </div>
              <Button variant="ghost" className="text-[11px] tracking-[0.04em] normal-case">Request export</Button>
            </div>
            <div className="border border-[var(--accent)] p-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-[14px] font-medium text-[var(--accent)]">Delete account</div>
                <div className="text-[12px] text-[var(--fg-mute)] mt-1">Removes all projects, exports, ledger. Irreversible.</div>
              </div>
              <Button variant="destructive" className="text-[11px] tracking-[0.04em] normal-case">Delete</Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
