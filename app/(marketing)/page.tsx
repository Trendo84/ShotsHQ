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
      <Reveal as="div"><PipelineDiagram /></Reveal>
      <Reveal as="div"><Surfaces /></Reveal>
      <Reveal as="div"><Templates compact /></Reveal>
      <Reveal as="div"><FeatureGrid /></Reveal>
      <Reveal as="div"><CTA /></Reveal>
    </>
  );
}
