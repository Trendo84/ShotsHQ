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
  { id: "01", label: "Intake",    icon: Upload,    detail: "Drop raw iOS PNGs. EXIF stripped on upload."        },
  { id: "02", label: "Analyze",   icon: Eye,       detail: "GPT-5 vision picks out feature, mood, palette."     },
  { id: "03", label: "Copy",      icon: Type,      detail: "Eight headline candidates, schema-validated."       },
  { id: "04", label: "Backdrop",  icon: ImageIcon, detail: "gpt-image-1 art direction. Real iPhone frame on top."},
  { id: "05", label: "Translate", icon: Globe,     detail: "41 locales fan out in parallel. Auto-relayout."     },
  { id: "06", label: "Render",    icon: Monitor,   detail: "Sharp on the server. Every required dimension."     },
  { id: "07", label: "Deliver",   icon: Send,      detail: "R2 zip or push direct to App Store Connect."        },
];

/**
 * Each stage has its own pulse animation, delayed by 0.85s × index.
 * Total cycle is 7 × 0.85s = ~6s, then a 1s gap before it loops.
 * Combined with the horizontal tracer, this creates a "data flowing
 * through the pipeline" feel without being distracting.
 */
const CYCLE_S    = 7;     // total tracer cycle
const PER_STAGE_S = CYCLE_S / STAGES.length;

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

        {/* ── Desktop: full unified pipeline (nodes + connectors + cards) ── */}
        <div className="hidden md:block relative">
          {/* Horizontal spine — sits on the row of icon nodes */}
          <div
            aria-hidden
            className="absolute left-[5%] right-[5%] h-px bg-[var(--line)]"
            style={{ top: "44px" }}
          />

          {/* Animated tracer — bright dot + trailing glow that travels the spine */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: "42px",
              left: "5%",
              right: "5%",
              height: "5px",
            }}
          >
            <div className="pipeline-tracer absolute h-[5px] -translate-x-1/2 will-change-[left]">
              <div className="absolute inset-0 bg-[var(--accent)] blur-[6px] opacity-90 rounded-full" />
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[5px] bg-[var(--accent)] rounded-full" />
            </div>
          </div>

          <ol className="relative grid grid-cols-7 gap-x-3">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const isLast = i === STAGES.length - 1;
              const delay  = `${(i * PER_STAGE_S).toFixed(2)}s`;

              return (
                <li key={s.id} className="relative flex flex-col items-center">

                  {/* Stage number — sits ABOVE node so the spine connects through node centers */}
                  <span className="t-mono-xs leading-none mb-2 text-[var(--fg-mute)]">
                    {s.id}
                  </span>

                  {/* Icon node — pulses briefly when tracer arrives */}
                  <div
                    className={`pipeline-node relative w-[68px] h-[68px] grid place-items-center border bg-[var(--bg)] z-10 transition-colors ${
                      isLast
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-[var(--line-strong)] text-[var(--fg)]"
                    }`}
                    style={{ animationDelay: delay }}
                  >
                    <Icon size={22} strokeWidth={1.5} aria-hidden />
                  </div>

                  {/* Label */}
                  <div className="mt-3 t-mono-xs text-center text-[var(--fg)]">
                    {s.label.toUpperCase()}
                  </div>

                  {/* Vertical connector to detail card */}
                  <div
                    aria-hidden
                    className="w-px h-8 bg-[var(--line)] mt-3"
                  />

                  {/* Detail card — same column, visually anchored to its node */}
                  <div className="w-full bg-[var(--bg)] border border-[var(--line)] p-3 min-h-[120px] flex flex-col gap-1.5">
                    <div className="t-eyebrow t-numeric flex items-baseline gap-2">
                      <span className="text-[var(--accent)]">{s.id}</span>
                      <span>{s.label}</span>
                    </div>
                    <p className="t-prose text-[12px] mt-auto leading-snug">{s.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* ── Mobile: vertical timeline ─────────────────────────────────── */}
        <ol className="md:hidden relative space-y-4 pl-7">
          <div
            aria-hidden
            className="absolute left-[24px] top-3 bottom-3 w-px bg-[var(--line)]"
          />
          <div
            aria-hidden
            className="pipeline-tracer-mobile absolute left-[22px] w-[5px] h-[5px] rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]"
          />
          {STAGES.map((s, i) => {
            const Icon   = s.icon;
            const isLast = i === STAGES.length - 1;
            return (
              <li key={s.id} className="relative">
                <div className="flex items-center gap-3">
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
                </div>
                <div className="ml-1 mt-2 mb-1 bg-[var(--bg)] border border-[var(--line)] p-3">
                  <p className="t-prose text-[12px] leading-snug">{s.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Animations — scoped here so they don't leak into globals.css */}
      <style>{`
        @keyframes pipeline-tracer-x {
          0%   { left: 0%;   opacity: 0; }
          5%   { left: 0%;   opacity: 1; }
          95%  { left: 100%; opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .pipeline-tracer {
          animation: pipeline-tracer-x ${CYCLE_S}s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        @keyframes pipeline-node-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 transparent;
            border-color: var(--line-strong);
          }
          15% {
            box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent);
            border-color: var(--accent);
          }
          30% {
            box-shadow: 0 0 0 0 transparent;
            border-color: var(--line-strong);
          }
        }
        .pipeline-node {
          animation: pipeline-node-pulse ${CYCLE_S}s linear infinite;
        }

        @keyframes pipeline-tracer-y {
          0%   { top: 0%;    opacity: 0; }
          5%   { top: 0%;    opacity: 1; }
          95%  { top: 100%;  opacity: 1; }
          100% { top: 100%;  opacity: 0; }
        }
        .pipeline-tracer-mobile {
          animation: pipeline-tracer-y ${CYCLE_S}s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .pipeline-tracer,
          .pipeline-tracer-mobile,
          .pipeline-node { animation: none; }
        }
      `}</style>
    </section>
  );
}
