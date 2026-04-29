import {
  Upload,
  Eye,
  Type,
  Image as ImageIcon,
  Globe,
  Monitor,
  Send,
  type LucideIcon,
} from "lucide-react";

type Stage = {
  id:     string;
  label:  string;
  icon:   LucideIcon;
  detail: string;
};

const STAGES: Stage[] = [
  { id: "01", label: "Intake",    icon: Upload,    detail: "Drop raw iOS PNGs. EXIF stripped on upload." },
  { id: "02", label: "Analyze",   icon: Eye,       detail: "GPT-5 vision picks out feature, mood, palette." },
  { id: "03", label: "Copy",      icon: Type,      detail: "Eight headline candidates, schema-validated." },
  { id: "04", label: "Backdrop",  icon: ImageIcon, detail: "gpt-image-1 art direction. Real iPhone frame on top." },
  { id: "05", label: "Translate", icon: Globe,     detail: "41 locales fan out in parallel. Auto-relayout." },
  { id: "06", label: "Render",    icon: Monitor,   detail: "Sharp on the server. Every required dimension." },
  { id: "07", label: "Deliver",   icon: Send,      detail: "R2 zip or push direct to App Store Connect." },
];

export function PipelineDiagram() {
  return (
    <section className="border-b border-[var(--line)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-20 md:py-28">

        {/* Header */}
        <div className="grid grid-cols-12 gap-8 mb-14 items-end">
          <h2 className="col-span-12 md:col-span-7 t-display text-[clamp(2rem,5vw,4rem)] leading-[0.95]">
            Seven stages.<br />
            <span className="text-[var(--accent)]">One pipeline.</span>
          </h2>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md">
            Every stage is independently observable, retryable, and refunds
            credits on failure — including partial failures inside a locale
            fan-out.
          </p>
        </div>

        {/* Flow row — horizontal on md+, vertical stack on mobile */}
        <div className="hidden md:block relative">
          {/* Spine line connecting all stages */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-[34px] h-px bg-[var(--line)]"
          />

          <ol className="relative grid grid-cols-7 gap-3">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const isLast = i === STAGES.length - 1;
              return (
                <li key={s.id} className="relative flex flex-col items-center">
                  {/* Node */}
                  <div
                    className={`relative w-[68px] h-[68px] grid place-items-center border bg-[var(--bg)] z-10 transition-colors ${
                      isLast
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-[var(--line-strong)] text-[var(--fg)]"
                    }`}
                  >
                    {/* Stage number ribbon */}
                    <span className="absolute -top-px left-0 right-0 t-mono-xs text-center bg-[var(--bg)] -mt-2 mx-auto w-fit px-1.5 leading-none">
                      <span className={isLast ? "text-[var(--accent)]" : "text-[var(--fg-mute)]"}>
                        {s.id}
                      </span>
                    </span>
                    <Icon size={22} strokeWidth={1.5} aria-hidden />
                  </div>

                  {/* Label */}
                  <div className="mt-3 t-mono-xs text-center">
                    <span className="text-[var(--fg)]">{s.label.toUpperCase()}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Mobile vertical stack */}
        <ol className="md:hidden relative space-y-4 pl-7">
          <div
            aria-hidden
            className="absolute left-[24px] top-3 bottom-3 w-px bg-[var(--line)]"
          />
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const isLast = i === STAGES.length - 1;
            return (
              <li key={s.id} className="relative flex items-center gap-3">
                <div
                  className={`relative -ml-7 w-[48px] h-[48px] grid place-items-center border bg-[var(--bg)] shrink-0 ${
                    isLast
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-[var(--line-strong)] text-[var(--fg)]"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <div className="flex items-baseline gap-2 t-mono-xs">
                  <span className={isLast ? "text-[var(--accent)]" : "text-[var(--fg-mute)]"}>
                    {s.id}
                  </span>
                  <span className="text-[var(--fg)]">{s.label.toUpperCase()}</span>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Detail grid — same row positions reinforce the flow */}
        <ol className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-px bg-[var(--line)] border border-[var(--line)]">
          {STAGES.map((s) => (
            <li
              key={s.id}
              className="bg-[var(--bg)] p-4 min-h-[120px] flex flex-col gap-1.5"
            >
              <div className="t-eyebrow t-numeric flex items-baseline gap-2">
                <span className="text-[var(--accent)]">{s.id}</span>
                <span>{s.label}</span>
              </div>
              <p className="t-prose text-[12px] mt-auto leading-snug">{s.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
