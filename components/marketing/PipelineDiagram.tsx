import type { ReactNode } from "react";

type Stage = {
  id:     string;
  label:  string;
  icon:   ReactNode;
  title:  string;
  detail: string;
};

// ── Custom SVG icons ─────────────────────────────────────────────────────────
// Outlined, 24×24 viewBox, stroke=currentColor, consistent 1.5 stroke weight.
// Each icon represents the stage's actual concept, not a generic noun.

const I_INTAKE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
    {/* Tray */}
    <path d="M3 16 L3 21 L21 21 L21 16" />
    {/* Arrow into tray */}
    <path d="M12 3 L12 16" />
    <path d="M7 8 L12 3 L17 8" />
    {/* Stage marks */}
    <path d="M9 21 L9 19" />
    <path d="M15 21 L15 19" />
  </svg>
);

const I_ANALYZE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
    {/* Bracket corners */}
    <path d="M3 7 L3 3 L7 3" />
    <path d="M17 3 L21 3 L21 7" />
    <path d="M21 17 L21 21 L17 21" />
    <path d="M7 21 L3 21 L3 17" />
    {/* Crosshair circle */}
    <circle cx="12" cy="12" r="3.5" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    {/* Scan line */}
    <path d="M12 4 L12 7" />
    <path d="M12 17 L12 20" />
  </svg>
);

const I_COPY = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
    {/* Quote marks above */}
    <path d="M6 5 L6 9 L8 9" />
    <path d="M16 5 L16 9 L18 9" />
    {/* Type baseline */}
    <path d="M4 12 L20 12" />
    {/* Paragraph rules */}
    <path d="M6 16 L18 16" />
    <path d="M6 19 L14 19" />
  </svg>
);

const I_BACKDROP = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
    {/* Outer canvas */}
    <rect x="3" y="3" width="18" height="18" />
    {/* Horizon line (backdrop layer) */}
    <path d="M3 14 L21 14" />
    {/* Sun / focal mark */}
    <circle cx="16.5" cy="8" r="1.6" />
    {/* Phone silhouette in center */}
    <rect x="10" y="9.5" width="4" height="9" rx="0.6" />
    <path d="M11 11 L13 11" />
  </svg>
);

const I_TRANSLATE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12 L21 12" />
    <ellipse cx="12" cy="12" rx="4" ry="9" />
    {/* Equator tick */}
    <path d="M6 7 L6 9" />
    <path d="M18 15 L18 17" />
  </svg>
);

const I_RENDER = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
    {/* Monitor frame */}
    <rect x="2.5" y="4" width="19" height="13" />
    {/* Title bar */}
    <path d="M2.5 8 L21.5 8" />
    {/* Render bars (progress) */}
    <path d="M5.5 11.5 L14 11.5" />
    <path d="M5.5 14.5 L11 14.5" />
    {/* Stand */}
    <path d="M9 17 L9 20" />
    <path d="M15 17 L15 20" />
    <path d="M7 20 L17 20" />
  </svg>
);

const I_DELIVER = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
    {/* Package box */}
    <rect x="2" y="6" width="13" height="12" />
    {/* Tape / seal */}
    <path d="M2 10 L15 10" />
    <path d="M8.5 6 L8.5 10" />
    {/* Outbound arrow */}
    <path d="M16 12 L22 12" />
    <path d="M19 9 L22 12 L19 15" />
  </svg>
);

const STAGES: Stage[] = [
  { id: "01", label: "Intake",    icon: I_INTAKE,    title: "RAW SCREENSHOTS", detail: "Drag in your iOS PNGs. Dimensions verified, files staged automatically."   },
  { id: "02", label: "Analyze",   icon: I_ANALYZE,   title: "AI VISION READ",  detail: "Picks out the feature, mood, and palette in every screen."                  },
  { id: "03", label: "Copy",      icon: I_COPY,      title: "HEADLINE BANK",   detail: "Eight headline options per screen. Guaranteed well-formed output."          },
  { id: "04", label: "Backdrop",  icon: I_BACKDROP,  title: "ART DIRECTION",   detail: "AI-generated backdrops. A real iPhone frame composites on top."             },
  { id: "05", label: "Translate", icon: I_TRANSLATE, title: "41 LOCALES",      detail: "Every language in parallel. Auto-relayout when copy length changes."        },
  { id: "06", label: "Render",    icon: I_RENDER,    title: "PIXEL-EXACT",     detail: "Studio renders the active panel at App Store-exact dimensions. Pixel-perfect."  },
  { id: "07", label: "Deliver",   icon: I_DELIVER,   title: "EXPORT READY",    detail: "Download a PNG per panel today. ZIP pack + App Store Connect push land in v1.1." },
];

// ── Pacing ───────────────────────────────────────────────────────────────────
const CYCLE_S            = 9;
const TRACER_START_PCT   = 4;
const TRACER_TRAVEL_PCT  = 92;
const SPINE_INSET_PCT    = 5;
const LEAD_S             = 0.18;

function stageDelay(i: number, total: number): number {
  const colCenterPct  = ((i + 0.5) / total) * 100;
  const spineWidthPct = 100 - 2 * SPINE_INSET_PCT;
  const tracerLeftPct = ((colCenterPct - SPINE_INSET_PCT) / spineWidthPct) * 100;
  const cycleProgress = TRACER_START_PCT + (tracerLeftPct * TRACER_TRAVEL_PCT) / 100;
  const arrivalS      = (cycleProgress / 100) * CYCLE_S;
  return Math.max(0, arrivalS - LEAD_S);
}

export function PipelineDiagram() {
  return (
    <section className="border-b border-[var(--line)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">

        {/* Header — varied cadence: descriptive headline (was period-period
           "Seven stages. One pipeline.") and the supporting line leads with
           the strongest claim (refunds-on-failure) per UX audit pass 2. */}
        <div className="grid grid-cols-12 gap-8 mb-14 items-end">
          <div className="col-span-12 md:col-span-7">
            <div className="t-eyebrow t-eyebrow-accent mb-3">The pipeline</div>
            <h2 className="t-display t-h-2 text-balance">
              How a raw screenshot becomes <span className="text-[var(--accent)]">a finished listing</span>.
            </h2>
          </div>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md text-[var(--fg)]">
            Failures refund credits automatically — even a single locale
            inside the 41-way translate fan-out. Retry just the part that
            broke, never the whole pack.
          </p>
        </div>

        {/* ── Desktop ─────────────────────────────────────────────────────── */}
        <div className="hidden md:block relative">
          {/* Spine */}
          <div
            aria-hidden
            className="absolute h-px bg-[var(--line)]"
            style={{ left: `${SPINE_INSET_PCT}%`, right: `${SPINE_INSET_PCT}%`, top: "44px" }}
          />

          {/* Tracer — clean precision dot, thin trail */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top:    "41px",
              left:   `${SPINE_INSET_PCT}%`,
              right:  `${SPINE_INSET_PCT}%`,
              height: "7px",
            }}
          >
            <div className="pipeline-tracer absolute h-[7px] w-[7px] -translate-x-1/2 will-change-[left]">
              <div className="absolute top-1/2 -translate-y-1/2 right-[3px] h-px w-[64px] bg-gradient-to-l from-[var(--accent)] to-transparent opacity-70" />
              <div className="absolute inset-0 bg-[var(--accent)] blur-[5px] opacity-80 rounded-full" />
              <div className="absolute inset-0 bg-[var(--accent)] rounded-full" />
            </div>
          </div>

          <ol className="relative grid grid-cols-7 gap-x-3 items-stretch">
            {STAGES.map((s, i) => {
              const delay = `${stageDelay(i, STAGES.length).toFixed(3)}s`;
              return (
                <li
                  key={s.id}
                  className="pipeline-stage relative flex flex-col items-center"
                  style={{ animationDelay: delay }}
                >
                  <span className="pipeline-stage-num t-mono-xs leading-none mb-2">{s.id}</span>

                  <div className="pipeline-node relative w-[68px] h-[68px] grid place-items-center border bg-[var(--bg)] z-10">
                    <span className="block w-[26px] h-[26px]" aria-hidden>{s.icon}</span>
                  </div>

                  <div className="pipeline-stage-label mt-3 t-mono-xs text-center">
                    {s.label.toUpperCase()}
                  </div>

                  {/* Vertical connector */}
                  <div className="relative w-px h-8 mt-3 bg-[var(--line)]">
                    <div
                      aria-hidden
                      className="pipeline-connector absolute inset-x-0 top-0 bg-[var(--accent)]"
                      style={{ animationDelay: delay }}
                    />
                  </div>

                  {/* Detail card — fixed height, all 7 match exactly */}
                  <div className="pipeline-card relative w-full bg-[var(--bg)] border border-[var(--line)] flex flex-col overflow-hidden h-[180px]">
                    <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-[var(--line)]">
                      <div
                        className="pipeline-card-bar absolute inset-y-0 left-0 bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]"
                        style={{ animationDelay: delay }}
                      />
                    </div>

                    <div className="p-3.5 flex flex-col gap-2 h-full">
                      {/* Header row: number + label, baseline aligned */}
                      <div className="t-eyebrow t-numeric flex items-baseline gap-2">
                        <span className="text-[var(--accent)]">{s.id}</span>
                        <span className="text-[var(--fg-mute)]">{s.label.toUpperCase()}</span>
                      </div>

                      {/* Title — uppercase mono, the "what" */}
                      <div className="text-[13px] font-mono uppercase tracking-[0.04em] leading-[1.15] text-[var(--fg)]">
                        {s.title}
                      </div>

                      {/* Body — sticks to bottom for visual balance */}
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
        {/* aria-hidden keeps SR users from reading the same 7 items twice —
            the desktop <ol> above is the canonical, semantic list. */}
        <ol aria-hidden="true" className="md:hidden relative space-y-5 pl-7">
          <div aria-hidden className="absolute left-[24px] top-3 bottom-3 w-px bg-[var(--line)]" />
          <div
            aria-hidden
            className="pipeline-tracer-mobile absolute left-[19px] w-[7px] h-[7px] rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent),0_0_24px_color-mix(in_srgb,var(--accent)_50%,transparent)]"
          />
          {STAGES.map((s, i) => {
            const delay = `${stageDelay(i, STAGES.length).toFixed(3)}s`;
            return (
              <li key={s.id} className="pipeline-stage relative" style={{ animationDelay: delay }}>
                <div className="flex items-center gap-3">
                  <div className="pipeline-node relative -ml-7 w-[48px] h-[48px] grid place-items-center border border-[var(--line-strong)] bg-[var(--bg)] shrink-0">
                    <span className="block w-[20px] h-[20px]" aria-hidden>{s.icon}</span>
                  </div>
                  <div className="flex items-baseline gap-2 t-mono-xs">
                    <span className="pipeline-stage-num text-[var(--fg-mute)]">{s.id}</span>
                    <span className="text-[var(--fg)]">{s.label.toUpperCase()}</span>
                  </div>
                </div>
                <div className="pipeline-card relative ml-1 mt-2 mb-1 bg-[var(--bg)] border border-[var(--line)] overflow-hidden h-[110px]">
                  <div className="absolute top-0 left-0 right-0 h-px bg-[var(--line)]">
                    <div
                      className="pipeline-card-bar absolute inset-y-0 left-0 bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]"
                      style={{ animationDelay: delay }}
                    />
                  </div>
                  <div className="p-3 flex flex-col gap-1 h-full">
                    <div className="text-[12px] font-mono uppercase tracking-[0.04em] leading-tight text-[var(--fg)]">
                      {s.title}
                    </div>
                    <p className="t-prose text-[12px] leading-snug text-[var(--fg-dim)] mt-auto">
                      {s.detail}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <style>{`
        @keyframes pipeline-tracer-x {
          0%   { left: 0%;   opacity: 0; }
          ${TRACER_START_PCT}%   { left: 0%;   opacity: 1; }
          ${TRACER_START_PCT + TRACER_TRAVEL_PCT}%  { left: 100%; opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .pipeline-tracer { animation: pipeline-tracer-x ${CYCLE_S}s linear infinite; }

        @keyframes pipeline-tracer-y {
          0%   { top: 0;                opacity: 0; }
          ${TRACER_START_PCT}%   { top: 0;                opacity: 1; }
          ${TRACER_START_PCT + TRACER_TRAVEL_PCT}%  { top: calc(100% - 7px); opacity: 1; }
          100% { top: calc(100% - 7px); opacity: 0; }
        }
        .pipeline-tracer-mobile { animation: pipeline-tracer-y ${CYCLE_S}s linear infinite; }

        @keyframes pipeline-stage-active {
          0%      { --stage-active-strength: 0; }
          1.5%    { --stage-active-strength: 1; }
          9%      { --stage-active-strength: 1; }
          11%     { --stage-active-strength: 0; }
          100%    { --stage-active-strength: 0; }
        }
        .pipeline-stage { animation: pipeline-stage-active ${CYCLE_S}s linear infinite; }

        .pipeline-stage .pipeline-node {
          border-color: color-mix(in srgb, var(--accent) calc(var(--stage-active-strength, 0) * 100%), var(--line-strong));
          color:        color-mix(in srgb, var(--accent) calc(var(--stage-active-strength, 0) * 100%), var(--fg));
          box-shadow:   0 0 0 calc(var(--stage-active-strength, 0) * 6px)
                        color-mix(in srgb, var(--accent) calc(var(--stage-active-strength, 0) * 28%), transparent),
                        inset 0 0 0 calc(var(--stage-active-strength, 0) * 1px) var(--accent);
        }
        .pipeline-stage .pipeline-stage-label,
        .pipeline-stage .pipeline-stage-num {
          color: color-mix(in srgb, var(--accent) calc(var(--stage-active-strength, 0) * 100%), var(--fg-mute));
        }
        .pipeline-stage .pipeline-card {
          border-color: color-mix(in srgb, var(--accent) calc(var(--stage-active-strength, 0) * 100%), var(--line));
          background:   color-mix(in srgb, var(--accent) calc(var(--stage-active-strength, 0) * 6%), var(--bg));
          transform:    translateY(calc(var(--stage-active-strength, 0) * -2px));
          transition:   transform 200ms ease-out;
        }

        @keyframes pipeline-connector-fill {
          0%, 1.4%  { height: 0%; opacity: 1; }
          4%        { height: 100%; opacity: 1; }
          9%        { height: 100%; opacity: 1; }
          11%       { height: 100%; opacity: 0; }
          11.01%, 100% { height: 0%; opacity: 1; }
        }
        .pipeline-connector { animation: pipeline-connector-fill ${CYCLE_S}s linear infinite; height: 0%; }

        @keyframes pipeline-card-bar-fill {
          0%, 1.4%  { width: 0%; opacity: 1; }
          5%        { width: 100%; opacity: 1; }
          9%        { width: 100%; opacity: 1; }
          11%       { width: 100%; opacity: 0; }
          11.01%, 100% { width: 0%; opacity: 0; }
        }
        .pipeline-card-bar { animation: pipeline-card-bar-fill ${CYCLE_S}s linear infinite; width: 0%; }

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
