import type { Metadata } from "next";
import { TEMPLATE_COUNT, Templates } from "@/components/marketing/Templates";

export const metadata: Metadata = {
  title: "Templates",
  description: "Curated starting points for your App Store screenshots — pick one, swap your shots in, ship.",
};

export default function TemplatesPage() {
  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-20 md:py-28">
          <div className="grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 md:col-span-7">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Templates</div>
              <h1 className="t-display text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[0.92]">
                {TEMPLATE_COUNT} ways<br />
                to start.
              </h1>
            </div>
            <div className="col-span-12 md:col-span-5">
              <p className="t-prose-lg max-w-md">
                Each template is a complete composition — typography, palette,
                device frame, and layout. Pick one as a base and customize
                anything in the editor.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Templates />
    </>
  );
}
