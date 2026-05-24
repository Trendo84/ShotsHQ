import { Hero } from "@/components/marketing/Hero";
import { LandingWorkflow } from "@/components/marketing/LandingWorkflow";
import { Templates } from "@/components/marketing/Templates";
import { LandingClose } from "@/components/marketing/LandingClose";
import { HomeJsonLd } from "@/components/seo/JsonLd";

/**
 * Landing page — structural redesign 2026-05-24.
 *
 * Was: Hero + Templates(compact) + PipelineDiagram + Surfaces +
 * FeatureGrid + CTA. Six section-stack blocks where each one was a
 * separate marketing concept. The user's "looks the same just
 * different colors" verdict was about exactly this composition:
 * every redesign cycle just tweaked the contents of the six blocks.
 *
 * Now: the page tells ONE story top-to-bottom — raw screenshots in,
 * polished launch pack out — across three coherent moments:
 *
 *   1. <Hero>            — the headline + before/after proof
 *   2. <LandingWorkflow> — a continuous four-step workflow narrative
 *                          (Drop → Compose → Polish → Ship), not
 *                          four discrete cards. One row, one
 *                          motion, one read.
 *   3. <Templates>       — the curated starting points (the "you
 *                          don't have to start from blank" beat)
 *   4. <LandingClose>    — close: ready-to-go template grid + final
 *                          CTA, fused into one final moment instead
 *                          of two separate sections (FeatureGrid +
 *                          CTA were always read as one beat anyway)
 *
 * What got dropped on purpose:
 *   - PipelineDiagram (the "seven-stage timeline" lived as its own
 *     section even though the four-step workflow above carries the
 *     same idea more concretely)
 *   - Surfaces  (already a redundant "we ship to other channels too"
 *     beat — kept on /tools/web-hero where it actually belongs)
 *   - FeatureGrid (the six-up "modules" grid was the "section stack"
 *     pattern itself; collapsed into the workflow narrative)
 *
 * The result is three coherent moments on the page instead of six
 * comparable sections — fewer competing ideas per screen.
 */
export default function LandingPage() {
  return (
    <>
      <HomeJsonLd />
      <Hero />
      <LandingWorkflow />
      <Templates compact />
      <LandingClose />
    </>
  );
}
