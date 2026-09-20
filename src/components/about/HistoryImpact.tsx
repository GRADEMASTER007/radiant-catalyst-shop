import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, TrendingUp, Globe, Award } from "lucide-react";

const milestones = [
  { year: "2008", title: "Founded", description: "Healthy Fields SA established as a small-scale supplier of live cultures and natural health products in Gauteng" },
  { year: "2012", title: "Product Range Expanded", description: "Grew to offer 100+ products including kefir, kombucha, spirulina, EM1, and fermentation supplies" },
  { year: "2016", title: "Online Store Launched", description: "Living Culture Health e-commerce platform launched, serving customers across all 9 South African provinces" },
  { year: "2019", title: "Export Operations", description: "Began shipping to Botswana, Zambia, Zimbabwe, Namibia and other SADC countries" },
  { year: "2022", title: "Practitioner Network", description: "Partnered with health practitioners, clinics, and naturopaths across South Africa" },
  { year: "2026", title: "Worldwide Export", description: "Now shipping premium live cultures and superfoods to customers worldwide with full export documentation" },
];

const impactStats = [
  { icon: TrendingUp, value: "5,000+", label: "Customers served across SA" },
  { icon: Globe, value: "8+", label: "Countries with active orders" },
  { icon: Award, value: "#1", label: "Trusted probiotic supplier in SA" },
];

export const HistoryImpact = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Our <span className="bg-gradient-to-r from-[#22C55E] to-[#4ADE80] bg-clip-text text-transparent">History & Impact</span>
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            From humble beginnings in 2008, Gut Health Probiotics SA has grown into one of South Africa's most 
            trusted suppliers of live cultures, fermentation starters, and natural wellness products — 
            now serving customers across Africa and worldwide.
          </p>
        </motion.div>

        {/* Impact Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {impactStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-2xl font-display font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#0B3D2E] via-[#22C55E] to-[#0B3D2E] hidden md:block" />

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-8 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <Card className="glass-card inline-block">
                    <CardContent className="p-6">
                      <span className="text-2xl font-display font-bold text-primary">{milestone.year}</span>
                      <h3 className="font-semibold mt-1">{milestone.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="hidden md:flex w-4 h-4 rounded-full bg-primary border-4 border-background shadow-lg z-10" />
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
