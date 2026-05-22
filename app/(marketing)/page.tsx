import { Hero } from "@/components/marketing/Hero";
import { PipelineDiagram } from "@/components/marketing/PipelineDiagram";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Templates } from "@/components/marketing/Templates";
import { Surfaces } from "@/components/marketing/Surfaces";
import { Roadmap } from "@/components/marketing/Roadmap";
import { Comparison } from "@/components/marketing/Comparison";
import { Testimonials } from "@/components/marketing/Testimonials";
import { Faq } from "@/components/marketing/Faq";
import { CTA } from "@/components/marketing/CTA";
import { MetricsBand } from "@/components/marketing/MetricsBand";
import { Reveal } from "@/components/Reveal";
import { HomeJsonLd } from "@/components/seo/JsonLd";

export default function LandingPage() {
  return (
    <>
      <HomeJsonLd />
      <Hero />
      <Reveal as="div"><PipelineDiagram /></Reveal>
      <Reveal as="div"><MetricsBand /></Reveal>
      <Reveal as="div"><FeatureGrid /></Reveal>
      <Reveal as="div"><Surfaces /></Reveal>
      <Reveal as="div"><Templates compact /></Reveal>
      <Reveal as="div"><Testimonials /></Reveal>
      <Reveal as="div"><Comparison /></Reveal>
      <Reveal as="div"><Roadmap /></Reveal>
      <Reveal as="div"><Faq /></Reveal>
      <Reveal as="div"><CTA /></Reveal>
    </>
  );
}
