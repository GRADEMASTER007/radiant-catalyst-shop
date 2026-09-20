import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, MapPin, Youtube, ExternalLink } from "lucide-react";

const countries = [
  "South Africa", "Botswana", "Zimbabwe", "Zambia", "Namibia", "Worldwide"
];

export const FounderProfile = () => {
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
            Founder & <span className="bg-gradient-to-r from-[#22C55E] to-[#4ADE80] bg-clip-text text-transparent">Lead Expert</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="glass-card max-w-4xl mx-auto overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-3 gap-0">
                {/* Profile Image Placeholder */}
                <div className="bg-gradient-to-br from-[#0B3D2E]/30 to-[#22C55E]/20 p-8 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0B3D2E] to-[#22C55E] flex items-center justify-center">
                    <User className="h-16 w-16 text-white" />
                  </div>
                </div>

                {/* Profile Content */}
                <div className="md:col-span-2 p-8">
                  <h3 className="font-display text-2xl font-bold mb-2">Max van Heerden</h3>
                  <p className="text-primary font-medium mb-4">Founder — Healthy Fields SA / Living Culture Health</p>
                  
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Max van Heerden is the founder of Healthy Fields SA and the driving force behind 
                      Gut Health Probiotics South Africa (Living Culture Health).
                    </p>
                    <p>
                      With over 16 years of experience in natural health, fermentation, and sustainable agriculture, 
                      Max has helped thousands of South Africans discover the benefits of live probiotic cultures, 
                      fermented foods, and organic growing.
                    </p>
                    <p>
                      He provides expert guidance on probiotics, fermentation techniques, EM1 bio-fertilizers, 
                      and natural wellness — supporting families, health practitioners, and farmers across Africa.
                    </p>
                  </div>

                  {/* Countries Served */}
                  <div className="mt-6">
                    <p className="text-sm font-medium mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      We ship to:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {countries.map((country) => (
                        <span
                          key={country}
                          className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                        >
                          {country}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* YouTube Link */}
                  <div className="mt-6">
                    <a
                      href="https://www.youtube.com/@HealthyFieldsDFSAWonderful"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="gap-2">
                        <Youtube className="h-4 w-4 text-destructive" />
                        Watch Health & Wellness Videos
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
