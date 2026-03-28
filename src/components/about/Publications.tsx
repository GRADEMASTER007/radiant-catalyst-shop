import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ExternalLink, BookOpen } from "lucide-react";

const publications = [
  {
    title: "Complete Guide to Water Kefir Brewing",
    author: "Gut Health Probiotics SA",
    description: "Step-by-step guide to brewing probiotic-rich water kefir at home, including flavouring ideas and troubleshooting tips.",
    type: "Guide"
  },
  {
    title: "Kombucha Brewing for Beginners",
    author: "Purely Health Nutra",
    description: "Everything you need to know about growing a SCOBY, first and second fermentation, and bottling your own kombucha.",
    type: "Guide"
  },
  {
    title: "EM1 Bio-Fertilizer for South African Farms",
    author: "Healthy Fields SA",
    description: "How to use Effective Microorganisms (EM1) for soil health, composting, and sustainable crop production.",
    type: "Farming Guide"
  },
  {
    title: "Gut Health & Probiotics: A Practitioner's Reference",
    author: "Gut Health Probiotics SA",
    description: "Clinical reference guide for naturopaths, dietitians, and health practitioners on probiotic strains and applications.",
    type: "Professional Guide"
  },
  {
    title: "Spirulina & Chlorella: Growing Live Algae Cultures",
    author: "Purely Health Nutra",
    description: "How to cultivate and maintain live spirulina and chlorella cultures for personal nutrition and supplementation.",
    type: "Guide"
  }
];

const externalResources = [
  {
    title: "Gut Health Probiotics South Africa — Main Store",
    url: "https://purelyhealthnutra.com",
    description: "Shop live cultures, fermentation starters, superfoods, and bio-fertilizers"
  },
  {
    title: "Gut Health Blog & Recipes",
    url: "https://purelyhealthnutra.com/blog",
    description: "Latest articles, fermentation recipes, and natural wellness tips"
  },
  {
    title: "Healthy Fields SA YouTube Channel",
    url: "https://www.youtube.com/@HealthyFieldsDFSAWonderful",
    description: "Video guides on fermentation, probiotics, and sustainable farming"
  }
];

export const Publications = () => {
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
            Guides & <span className="bg-gradient-to-r from-[#22C55E] to-[#4ADE80] bg-clip-text text-transparent">Resources</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access our free guides, recipes, and educational resources to help you 
            get started with probiotics, fermentation, and natural wellness.
          </p>
        </motion.div>

        {/* Publications Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {publications.map((pub, index) => (
            <motion.div
              key={pub.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full glass-card hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0B3D2E] to-[#22C55E] flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {pub.type}
                      </span>
                      <h3 className="font-semibold mt-2 mb-1 line-clamp-2">{pub.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">By {pub.author}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{pub.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* External Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h3 className="font-display text-xl font-bold mb-6 text-center">
            <BookOpen className="h-5 w-5 inline-block mr-2 text-primary" />
            External Resources
          </h3>
          <div className="space-y-4">
            {externalResources.map((resource) => (
              <a
                key={resource.title}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="glass-card hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-sm">{resource.title}</h4>
                      <p className="text-xs text-muted-foreground">{resource.description}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-primary flex-shrink-0" />
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
