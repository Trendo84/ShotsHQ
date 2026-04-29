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
  id:        string;
  label:     string;
  icon:      LucideIcon;
  /** Single uppercase line — the "what" in 1-3 words. */
  title:     string;
  /** Single sentence — the "how/detail". */
  detail:    string;
};

const STAGES: Stage[] = [
  { id: "01", label: "Intake",    icon: Upload,    title: "RAW SCREENSHOTS",   detail: "Drop iOS PNGs. EXIF stripped, R2-staged, dimensions verified." },
  { id: "02", label: "Analyze",   icon: Eye,       title: "GPT-5 VISION READ", detail: "Detects feature, mood, palette, copy hints — per screenshot." },
  { id: "03", label: "Copy",      icon: Type,      title: "HEADLINE CANDIDATES",detail: "Eight options per frame. Zod-validated structured output." },
  { id: "04", label: "Backdrop",  icon: ImageIcon, title: "ART DIRECTION",      detail: "gpt-image-1 backdrops. Real iPhone frame composited on top." },
  { id: "05", label: "Translate", icon: Globe,     title: "41 LOCALES",         detail: "Parallel fan-out. Auto-relayout for each language length." },
  { id: "06", label: "Render",    icon: Monitor,   title: "SERVER PNGs",        detail: "Sharp on the server. 1290×2796, 1320×2868, 2064×2752, more." },
  { id: "07", label: "Deliver",   icon: Send,      title: "EXPORT READY",       detail: "R2 zip download or direct push to App Store Connect." },
];

/** Total cycle length in seconds. */
const CYCLE_S = 7;

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

        {/* ── Desktop ─────────────────────────────────────────────────────── */}
        <div className="hidden md:block relative">
          {/* Spine */}
          <div
            aria-hidden
            className="absolute left-[5%] right-[5%] h-px bg-[var(--line)]"
            style={{ top: "44px" }}
          />

          {/* Tracer — bright dot with soft glow halo */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{ top: "39px", left: "5%", right: "5%", height: "11px" }}
          >
            <div className="pipeline-tracer absolute h-[11px] w-[11px] -translate-x-1/2 will-change-[left]">
              <div className="absolute inset-0 bg-[var(--accent)] blur-[10px] opacity-90 rounded-full" />
              <div className="absolute inset-0 bg-[var(--accent)] rounded-full shadow-[0_0_20px_var(--accent),0_0_40px_color-mix(in_srgb,var(--accent)_50%,transparent)]" />
            </div>
          </div>

          <ol className="relative grid grid-cols-7 gap-x-3">
            {STAGES.map((s, i) => {
              const Icon  = s.icon;
              const delay = `${(i * (CYCLE_S / STAGES.length)).toFixed(2)}s`;
              return (
                <li
                  key={s.id}
                  className="pipeline-stage relative flex flex-col items-center"
                  style={{ animationDelay: delay }}
                >
                  {/* Stage number */}
                  <span className="pipeline-stage-num t-mono-xs leading-none mb-2">
                    {s.id}
                  </span>

                  {/* Icon node */}
                  <div className="pipeline-node relative w-[68px] h-[68px] grid place-items-center border bg-[var(--bg)] z-10 transition-all">
                    <Icon size={22} strokeWidth={1.5} aria-hidden />
                  </div>

                  {/* Label */}
                  <div className="pipeline-stage-label mt-3 t-mono-xs text-center transition-colors">
                    {s.label.toUpperCase()}
                  </div>

                  {/* Vertical connector — fills with accent when active */}
                  <div className="relative w-px h-8 mt-3 bg-[var(--line)]">
                    <div
                      aria-hidden
                      className="pipeline-connector absolute inset-x-0 top-0 bg-[var(--accent)]"
                      style={{ animationDelay: delay }}
                    />
                  </div>

                  {/* Detail card */}
                  <div className="pipeline-card relative w-full bg-[var(--bg)] border border-[var(--line)] flex flex-col transition-all overflow-hidden">
                    {/* Top accent bar — fills L→R when active */}
                    <div
                      aria-hidden
                      className="absolute top-0 left-0 right-0 h-px bg-[var(--line)]"
                    >
                      <div
                        className="pipeline-card-bar absolute inset-y-0 left-0 bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]"
                        style={{ animationDelay: delay }}
                      />
                    </div>

                    <div className="p-3.5 flex flex-col gap-1.5 min-h-[140px]">
                      <div className="t-eyebrow t-numeric flex items-baseline gap-2">
                        <span className="text-[var(--accent)]">{s.id}</span>
                        <span className="text-[var(--fg-mute)]">{s.label.toUpperCase()}</span>
                      </div>
                      <div
                        className="text-[13px] font-mono uppercase tracking-[0.04em] leading-tight text-[var(--fg)] mt-0.5"
                      >
                        {s.title}
                      </div>
                      <p className="t-prose text-[12px] leading-snug mt-auto text-[var(--fg-dim)]">
                        {s.detail}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* ── Mobile ──────────────────────────────────────────────────────── */}
        <ol className="md:hidden relative space-y-5 pl-7">
          <div
            aria-hidden
            className="absolute left-[24px] top-3 bottom-3 w-px bg-[var(--line)]"
          />
          <div
            aria-hidden
            className="pipeline-tracer-mobile absolute left-[19px] w-[11px] h-[11px] rounded-full bg-[var(--accent)] shadow-[0_0_16px_var(--accent),0_0_32px_color-mix(in_srgb,var(--accent)_50%,transparent)]"
          />
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const delay = `${(i * (CYCLE_S / STAGES.length)).toFixed(2)}s`;
            return (
              <li
                key={s.id}
                className="pipeline-stage relative"
                style={{ animationDelay: delay }}
              >
                <div className="flex items-center gap-3">
                  <div className="pipeline-node relative -ml-7 w-[48px] h-[48px] grid place-items-center border border-[var(--line-strong)] bg-[var(--bg)] shrink-0 transition-all">
                    <Icon size={18} strokeWidth={1.5} />
                  </div>
                  <div className="flex items-baseline gap-2 t-mono-xs">
                    <span className="pipeline-stage-num text-[var(--fg-mute)]">{s.id}</span>
                    <span className="text-[var(--fg)]">{s.label.toUpperCase()}</span>
                  </div>
                </div>
                <div className="pipeline-card relative ml-1 mt-2 mb-1 bg-[var(--bg)] border border-[var(--line)] overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-[var(--line)]">
                    <div
                      className="pipeline-card-bar absolute inset-y-0 left-0 bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]"
                      style={{ animationDelay: delay }}
                    />
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <div
                      className="text-[12px] font-mono uppercase tracking-[0.04em] leading-tight text-[var(--fg)]"
                    >
                      {s.title}
                    </div>
                    <p className="t-prose text-[12px] leading-snug text-[var(--fg-dim)]">
                      {s.detail}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Animations */}
      <style>{`
        /* Tracer travels horizontal spine on a single ${CYCLE_S}s loop. */
        @keyframes pipeline-tracer-x {
          0%   { left: 0%;   opacity: 0; }
          4%   { left: 0%;   opacity: 1; }
          96%  { left: 100%; opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .pipeline-tracer {
          animation: pipeline-tracer-x ${CYCLE_S}s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        /* Mobile tracer — vertical */
        @keyframes pipeline-tracer-y {
          0%   { top: 0;    opacity: 0; }
          4%   { top: 0;    opacity: 1; }
          96%  { top: calc(100% - 11px); opacity: 1; }
          100% { top: calc(100% - 11px); opacity: 0; }
        }
        .pipeline-tracer-mobile {
          animation: pipeline-tracer-y ${CYCLE_S}s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        /* Each stage's column gets a one-shot "spotlight" per cycle.
           Active window is ~14% of the cycle (~1s out of 7). */
        @keyframes pipeline-stage-active {
          0%, 100% {
            --stage-active-strength: 0;
          }
          1%, 14% {
            --stage-active-strength: 1;
          }
        }
        .pipeline-stage {
          animation: pipeline-stage-active ${CYCLE_S}s linear infinite;
        }

        /* Node lights up via the strength variable */
        .pipeline-stage .pipeline-node {
          border-color: color-mix(
            in srgb,
            var(--accent) calc(var(--stage-active-strength, 0) * 100%),
            var(--line-strong)
          );
          color: color-mix(
            in srgb,
            var(--accent) calc(var(--stage-active-strength, 0) * 100%),
            var(--fg)
          );
          box-shadow: 0 0 0 calc(var(--stage-active-strength, 0) * 4px)
            color-mix(in srgb, var(--accent) calc(var(--stage-active-strength, 0) * 22%), transparent);
        }
        .pipeline-stage .pipeline-stage-label,
        .pipeline-stage .pipeline-stage-num {
          color: color-mix(
            in srgb,
            var(--accent) calc(var(--stage-active-strength, 0) * 100%),
            var(--fg-mute)
          );
        }
        .pipeline-stage .pipeline-card {
          border-color: color-mix(
            in srgb,
            var(--accent) calc(var(--stage-active-strength, 0) * 100%),
            var(--line)
          );
          background: color-mix(
            in srgb,
            var(--accent) calc(var(--stage-active-strength, 0) * 5%),
            var(--bg)
          );
        }

        /* Vertical connector fills top→down when active */
        @keyframes pipeline-connector-fill {
          0%, 100% { height: 0%; }
          1%  { height: 0%; }
          5%  { height: 100%; }
          14% { height: 100%; opacity: 1; }
          18% { height: 100%; opacity: 0; }
          19%, 100% { height: 0%; opacity: 1; }
        }
        .pipeline-connector {
          animation: pipeline-connector-fill ${CYCLE_S}s linear infinite;
          height: 0%;
        }

        /* Top bar of detail card fills L→R when active */
        @keyframes pipeline-card-bar-fill {
          0%, 100% { width: 0%; opacity: 1; }
          5%  { width: 0%; opacity: 1; }
          14% { width: 100%; opacity: 1; }
          18% { width: 100%; opacity: 0.4; }
          22% { width: 0%; opacity: 0; }
        }
        .pipeline-card-bar {
          animation: pipeline-card-bar-fill ${CYCLE_S}s linear infinite;
          width: 0%;
        }

        @media (prefers-reduced-motion: reduce) {
          .pipeline-tracer,
          .pipeline-tracer-mobile,
          .pipeline-stage,
          .pipeline-connector,
          .pipeline-card-bar { animation: none; }
        }
      `}</style>
    </section>
  );
}
