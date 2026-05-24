import { Hero } from "@/components/marketing/Hero";
import { PipelineDiagram } from "@/components/marketing/PipelineDiagram";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Templates } from "@/components/marketing/Templates";
import { Surfaces } from "@/components/marketing/Surfaces";
import { CTA } from "@/components/marketing/CTA";
import { Reveal } from "@/components/Reveal";
import { HomeJsonLd } from "@/components/seo/JsonLd";

export default function LandingPage() {
  return (
    <>
      <HomeJsonLd />
      <Hero />
      {/*
        Cycle (overnight redesign) reordered the landing cadence:
          1. Hero (with HeroBeforeAfterSlider — proof of output baked in)
          2. Templates compact — concrete proof of finished outputs
             (was buried below FeatureGrid; users were scrolling past
             the "what does the output look like" answer)
          3. Pipeline — how the engine works
          4. Surfaces — where the outputs land
          5. FeatureGrid — module-by-module breakdown
          6. CTA
        Reveal sections render visible by default now; the wrappers
        are kept for the polish animation only (see Reveal.tsx).
      */}
      <Reveal as="div"><Templates compact /></Reveal>
      <Reveal as="div"><PipelineDiagram /></Reveal>
      <Reveal as="div"><Surfaces /></Reveal>
      <Reveal as="div"><FeatureGrid /></Reveal>
      <Reveal as="div"><CTA /></Reveal>
    </>
  );
}
