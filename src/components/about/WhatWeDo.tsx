import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Droplets, 
  Leaf, 
  Users, 
  Sprout,
  FlaskConical,
  Heart,
  Truck,
  BookOpen
} from "lucide-react";

const services = [
  {
    icon: Droplets,
    title: "Live Probiotic Cultures",
    description: "Premium kefir grains (milk & water), kombucha SCOBYs, yogurt starters, sourdough cultures, and vinegar mothers — all guaranteed alive and active.",
    details: "Every culture is grown in-house and shipped fresh for maximum potency and viability."
  },
  {
    icon: FlaskConical,
    title: "Fermentation Supplies & Education",
    description: "Complete fermentation starter kits, brewing equipment, and step-by-step guides for beginners and experienced fermenters alike.",
    details: "Recipes, troubleshooting support, and WhatsApp guidance included with every order."
  },
  {
    icon: Leaf,
    title: "Superfoods & Algae Cultures",
    description: "Live spirulina and chlorella cultures, wheatgrass seeds, and nutrient-dense superfoods for health-conscious individuals and practitioners.",
    details: "Ideal for smoothies, supplements, and professional health practices."
  },
  {
    icon: Sprout,
    title: "EM1 Bio-Fertilizers & Farming",
    description: "Effective Microorganisms (EM1), BioSoil, BioPond, and organic growing inputs for sustainable agriculture, aquaponics, and regenerative farming.",
    details: "Used by farmers across South Africa for soil health, composting, and crop yields."
  }
];

export const WhatWeDo = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            What <span className="bg-gradient-to-r from-[#22C55E] to-[#4ADE80] bg-clip-text text-transparent">We Do</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We supply premium live cultures, fermentation starters, superfoods, and bio-fertilizers 
            to homes, clinics, and farms across South Africa, SADC, and worldwide.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full glass-card hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0B3D2E] to-[#22C55E] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <service.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold mb-2">{service.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                      <p className="text-xs text-muted-foreground/80">{service.details}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
