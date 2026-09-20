import { motion } from "motion/react";
import { Calendar } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";

export const AboutHero = () => {
  return (
    <>
      <SEOHead
        title="About Gut Health Probiotics SA | Our Story"
        description="Learn about Gut Health Probiotics South Africa — premium live cultures, fermentation starters, and natural wellness products. Based in Gauteng, shipping nationwide and worldwide."
        canonical="https://livingculturehealth.com/about"
        jsonLd={[{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About Gut Health Probiotics South Africa',
          description: 'Premium live probiotic cultures, fermentation starters, and natural health products. Based in Gauteng, South Africa.',
          url: 'https://livingculturehealth.com/about',
        }]}
      />
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B3D2E]/20 via-transparent to-[#22C55E]/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.1),transparent_70%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Calendar className="h-4 w-4" />
              Trusted Since 2008
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              About{" "}
              <span className="bg-gradient-to-r from-[#22C55E] to-[#4ADE80] bg-clip-text text-transparent">Gut Health Probiotics SA</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-4">
              Gut Health Probiotics South Africa (Living Culture Health) is a premium supplier of live probiotic cultures, 
              fermentation starters, superfoods and bio-fertilizers — serving homes, clinics, and farms 
              across South Africa and worldwide.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Founded by Max van Heerden under the Healthy Fields SA banner, we've grown from a small operation 
              into a trusted source of natural wellness products, helping thousands of families and practitioners 
              embrace the power of fermented foods and probiotics.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
};
