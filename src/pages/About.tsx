import { motion } from "framer-motion";
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

const About = () => {
  return (
    <div className="min-h-screen bg-background">
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
