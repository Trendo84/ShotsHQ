import Image from "next/image";

const STEPS = [
  { id: "01", label: "Intake",     detail: "Drop raw iOS PNGs. EXIF stripped on upload." },
  { id: "02", label: "Analyze",    detail: "GPT-5 vision picks out feature, mood, palette." },
  { id: "03", label: "Copy",       detail: "Eight headline candidates, schema-validated." },
  { id: "04", label: "Backdrop",   detail: "fal.ai Flux 2 + birefnet matte. Composited." },
  { id: "05", label: "Translate",  detail: "41 locales fan out in parallel. Auto-relayout." },
  { id: "06", label: "Render",     detail: "Sharp on the server. Every required dimension." },
  { id: "07", label: "Deliver",    detail: "R2 zip or push direct to App Store Connect." },
];

export function PipelineDiagram() {
  return (
    <section className="border-b border-[var(--line)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-8 mb-10 items-end">
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

        {/* Diagram — wide on desktop, scrollable on mobile */}
        <div className="-mx-4 md:mx-0 mb-10 overflow-x-auto md:overflow-visible pipeline-diagram-scroll">
          <div className="relative mx-auto min-w-[760px] md:min-w-0 px-4 md:px-0">
            <Image
              src="/pipeline.png"
              alt="Seven-stage ShotsHQ pipeline: intake, analyze, copy, backdrop, translate, render, deliver"
              width={2000}
              height={600}
              priority={false}
              sizes="(max-width: 768px) 760px, 100vw"
              className="w-full h-auto select-none pipeline-diagram-img"
              draggable={false}
            />
          </div>
        </div>

        {/* Detail captions — visually de-emphasised, screen-reader friendly */}
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-px bg-[var(--line)] border border-[var(--line)]">
          {STEPS.map((s) => (
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
