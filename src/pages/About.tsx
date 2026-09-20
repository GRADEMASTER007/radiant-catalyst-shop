import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutStats } from "@/components/about/AboutStats";
import { WhatWeDo } from "@/components/about/WhatWeDo";
import { HistoryImpact } from "@/components/about/HistoryImpact";
import { FounderProfile } from "@/components/about/FounderProfile";
import { YouthDevelopment } from "@/components/about/YouthDevelopment";
import { Publications } from "@/components/about/Publications";
import { SocialMediaHub } from "@/components/about/SocialMediaHub";
import { AboutCTA } from "@/components/about/AboutCTA";
import { SEOHead } from "@/components/seo/SEOHead";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="About Living Culture Health | Live Probiotic Cultures South Africa"
        description="Meet the team behind South Africa's trusted supplier of live kefir, kombucha, EM1, spirulina, and chlorella cultures. Family-run, science-backed, shipping nationwide."
        canonical="https://livingculturehealth.com/about"
      />
      <Header />
      <CartSidebar />

      <AboutHero />
      <AboutStats />
      <WhatWeDo />
      <HistoryImpact />
      <FounderProfile />
      <YouthDevelopment />
      <Publications />
      <SocialMediaHub />
      <AboutCTA />
    </div>
  );
};

export default About;
