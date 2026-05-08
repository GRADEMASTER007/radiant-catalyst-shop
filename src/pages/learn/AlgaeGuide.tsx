import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Microscope, 
  Beaker, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2,
  Fish,
  Leaf,
  Zap
} from "lucide-react";

export default function AlgaeGuide() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-24 pt-32 bg-gradient-to-br from-teal-900/10 via-background to-gut-cream/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge className="mb-4 bg-teal-600 text-white">Algae & Superfoods</Badge>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Spirulina & Chlorella{" "}
              <span className="text-teal-600">101</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Everything you need to know about live algae cultures. From laboratory research 
              to aquaculture, smoothies to biofuel projects.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild className="bg-teal-600 hover:bg-teal-700">
                <Link to="/products?category=algae-superfoods">
                  Shop Algae Cultures
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">
                  Bulk & Academic Enquiries
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What is Algae */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                What are Microalgae?
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground mb-8">
                <p>
                  Microalgae are microscopic, photosynthetic organisms that grow in water. They're 
                  among the oldest life forms on Earth and are incredibly efficient at converting 
                  sunlight, water and CO₂ into biomass.
                </p>
                <p>
                  <strong>Spirulina</strong> and <strong>Chlorella</strong> are two of the most 
                  widely cultivated microalgae, valued for their high protein content, vitamins, 
                  minerals and unique compounds.
                </p>
              </div>
            </motion.div>

            {/* Comparison Cards */}
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-teal-200 bg-gradient-to-br from-teal-50 to-white">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-white">S</span>
                    </div>
                    <CardTitle className="text-2xl text-teal-700">Spirulina</CardTitle>
                    <p className="text-sm text-muted-foreground italic">Arthrospira platensis</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Key Characteristics</h4>
                      <ul className="space-y-2 text-sm">
                        {[
                          "Blue-green colour (contains phycocyanin)",
                          "60-70% protein by dry weight",
                          "Spiral-shaped filaments",
                          "Grows in alkaline water (pH 9-11)",
                          "Complete protein with all essential amino acids",
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Common Uses</h4>
                      <div className="flex flex-wrap gap-2">
                        {["Smoothies", "Supplements", "Aquaculture", "Research", "Food colouring"].map((use, i) => (
                          <Badge key={i} variant="outline" className="border-teal-300">{use}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-green-200 bg-gradient-to-br from-green-50 to-white">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-white">C</span>
                    </div>
                    <CardTitle className="text-2xl text-green-700">Chlorella</CardTitle>
                    <p className="text-sm text-muted-foreground italic">Chlorella vulgaris</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Key Characteristics</h4>
                      <ul className="space-y-2 text-sm">
                        {[
                          "Bright green colour (high chlorophyll)",
                          "50-60% protein by dry weight",
                          "Single-celled, spherical shape",
                          "Grows in freshwater (neutral pH)",
                          "Contains Chlorella Growth Factor (CGF)",
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Common Uses</h4>
                      <div className="flex flex-wrap gap-2">
                        {["Detox support", "Supplements", "Biofuel research", "Water treatment", "Education"].map((use, i) => (
                          <Badge key={i} variant="outline" className="border-green-300">{use}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className="py-20 bg-gut-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-center">
                Who Uses Live Algae Cultures?
              </h2>
              <p className="text-lg text-muted-foreground mb-12 text-center max-w-2xl mx-auto">
                We supply fresh, high-density cultures to a diverse range of customers across South Africa and beyond.
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: GraduationCap,
                    title: "Universities & Schools",
                    desc: "Educational demonstrations, biology practicals, student research projects",
                    color: "text-blue-600 bg-blue-100"
                  },
                  {
                    icon: Microscope,
                    title: "Research Labs",
                    desc: "Controlled studies on algae growth, photosynthesis, bioremediation",
                    color: "text-purple-600 bg-purple-100"
                  },
                  {
                    icon: Fish,
                    title: "Aquaculture",
                    desc: "Live feed for fish larvae, rotifers and other aquatic organisms",
                    color: "text-cyan-600 bg-cyan-100"
                  },
                  {
                    icon: Zap,
                    title: "Biofuel Research",
                    desc: "Algae-based biodiesel and biogas research projects",
                    color: "text-amber-600 bg-amber-100"
                  },
                  {
                    icon: Leaf,
                    title: "Health & Wellness",
                    desc: "Fresh algae for smoothies, juices and home cultivation",
                    color: "text-green-600 bg-green-100"
                  },
                  {
                    icon: Beaker,
                    title: "Commercial Production",
                    desc: "Starter cultures for commercial algae farms and production facilities",
                    color: "text-teal-600 bg-teal-100"
                  },
                ].map((app, i) => (
                  <motion.div
                    key={app.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className={`w-12 h-12 rounded-lg ${app.color} flex items-center justify-center mb-4`}>
                          <app.icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold mb-2">{app.title}</h3>
                        <p className="text-sm text-muted-foreground">{app.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-center">
                Available Sizes & Pricing
              </h2>
              <p className="text-lg text-muted-foreground mb-8 text-center">
                We offer live cultures in various volumes with bulk discounts available.
              </p>

              <Card className="mb-8">
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Volume</th>
                          <th className="text-left py-3 px-4 font-semibold">Spirulina</th>
                          <th className="text-left py-3 px-4 font-semibold">Chlorella</th>
                          <th className="text-left py-3 px-4 font-semibold">Best For</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { vol: "500ml", spir: "R449", chlor: "R449", best: "Small projects, home use" },
                          { vol: "1L", spir: "R849", chlor: "R849", best: "Students, initial research" },
                          { vol: "5L", spir: "R3,499", chlor: "R3,499", best: "Labs, aquaculture" },
                          { vol: "10L", spir: "R5,999", chlor: "R5,999", best: "Commercial, large research" },
                          { vol: "20L", spir: "R9,999", chlor: "R9,999", best: "Production facilities" },
                        ].map((row, i) => (
                          <tr key={i} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">{row.vol}</td>
                            <td className="py-3 px-4 text-teal-600">{row.spir}</td>
                            <td className="py-3 px-4 text-green-600">{row.chlor}</td>
                            <td className="py-3 px-4 text-muted-foreground">{row.best}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">🎓 Academic Discount</h4>
                  <p className="text-sm text-blue-700">
                    Universities, schools and registered students qualify for special academic pricing. 
                    Contact us with your institution details.
                  </p>
                </div>
                <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <h4 className="font-semibold text-teal-800 mb-2">🌍 Shipping</h4>
                  <p className="text-sm text-teal-700">
                    We ship nationwide and to neighbouring countries. International shipping available 
                    for research institutions.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Algae Fertilizer */}
      <section className="py-20 bg-gut-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                Growing Your Own: Algae Fertilizer
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground mb-8">
                <p>
                  Want to grow and maintain your own algae culture? Our <strong>Algae Fertilizer 
                  Dry Mix</strong> provides the essential nutrients for spirulina and chlorella growth.
                </p>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">What's Included</h3>
                      <ul className="space-y-2 text-sm">
                        {[
                          "Balanced macro and micronutrients",
                          "Optimized for algae photosynthesis",
                          "Easy-dissolve formula",
                          "Detailed mixing instructions",
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Coverage</h3>
                      <p className="text-muted-foreground mb-4">
                        1kg of dry mix makes approximately <strong>33 litres</strong> of 
                        complete growth medium.
                      </p>
                      <Button asChild>
                        <Link to="/product/algae-fertilizer-1kg">
                          View Product
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-teal-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to Explore Algae?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Browse our range of live spirulina and chlorella cultures, or contact us for 
            bulk orders and academic pricing.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/products?category=algae-superfoods">
                Shop Algae
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gut-forest text-white">
        <div className="container mx-auto px-4 text-center text-white/70">
          <p>© 2026 Gut Health Probiotics South Africa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}