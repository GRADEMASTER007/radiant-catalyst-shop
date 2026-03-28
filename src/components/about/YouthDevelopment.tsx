import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, Briefcase, Sprout } from "lucide-react";

const initiatives = [
  {
    icon: Users,
    title: "Community Health Education",
    description: "We educate communities across South Africa on the benefits of probiotics, fermented foods, and natural wellness through workshops and online content."
  },
  {
    icon: GraduationCap,
    title: "Fermentation Training",
    description: "Hands-on training programmes teaching individuals how to brew kefir, kombucha, sauerkraut, and other fermented foods for personal health and small business opportunities."
  },
  {
    icon: Briefcase,
    title: "Practitioner Support",
    description: "We partner with naturopaths, dietitians, and health practitioners to supply clinical-grade probiotics and provide technical product guidance."
  },
  {
    icon: Sprout,
    title: "Sustainable Farming & EM1",
    description: "Supporting smallholder farmers with EM1 bio-fertilizer training, organic growing inputs, and regenerative agriculture practices across the SADC region."
  }
];

export const YouthDevelopment = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-[#0B3D2E] to-[#0B3D2E]/90 text-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Community Impact & <span className="text-[#4ADE80]">Training</span>
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Empowering families, practitioners, and farmers with knowledge and products 
            for better health and sustainable agriculture.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {initiatives.map((initiative, index) => (
            <motion.div
              key={initiative.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4ADE80] to-[#22C55E] flex items-center justify-center mx-auto mb-4">
                    <initiative.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2 text-white">{initiative.title}</h3>
                  <p className="text-sm text-white/70">{initiative.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
