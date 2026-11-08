import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingLogos } from "@/components/landing/LandingLogos";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingWorkflow } from "@/components/landing/LandingWorkflow";
import { LandingShowcase } from "@/components/landing/LandingShowcase";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white antialiased selection:bg-white/20">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingLogos />
        <LandingFeatures />
        <LandingWorkflow />
        <LandingShowcase />
        <LandingTestimonials />
        <LandingPricing />
        <LandingFAQ />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
