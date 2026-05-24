import type { Metadata } from "next";
import { Templates } from "@/components/marketing/Templates";
import { TEMPLATE_COUNT } from "@/lib/templates/catalog";

export const metadata: Metadata = {
  title: "Templates",
  description: "Curated starting points for your App Store screenshots — pick one, swap your shots in, ship.",
};

export default function TemplatesPage() {
  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-[1480px] px-4 py-14 md:px-8 md:py-20">
          <div className="grid grid-cols-12 items-end gap-8">
            <div className="col-span-12 md:col-span-7">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Templates</div>
              <h1 className="text-balance text-[clamp(2.4rem,6vw,5rem)] font-semibold tracking-[-0.045em] leading-[1.02] text-[var(--fg)]">
                Start from a proven layout,
                <br />
                <span className="text-[var(--accent)]">not a blank canvas.</span>
              </h1>
            </div>
            <div className="col-span-12 md:col-span-5">
              <p className="t-prose-lg max-w-md">
                {TEMPLATE_COUNT} starting points built for real App Store launches. Pick one, swap in your app, and refine the details in the editor.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Templates />
    </>
  );
}
