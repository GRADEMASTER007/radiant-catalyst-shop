import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Stethoscope, 
  BookOpen, 
  Users, 
  ArrowRight, 
  CheckCircle2,
  FlaskConical,
  Leaf,
  Microscope,
  FileText
} from "lucide-react";

export default function ForPractitioners() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-24 pt-32 bg-gradient-to-br from-blue-900/10 via-background to-gut-cream/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge className="mb-4 bg-blue-600 text-white">For Healthcare Professionals</Badge>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Resources for{" "}
              <span className="text-blue-600">Practitioners</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Science-backed information on probiotics, fermented foods, EM1 microbiology and 
              live algae cultures. Designed for doctors, dietitians, nutritionists and health coaches.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700">
                <a href="#probiotics-overview">
                  View Probiotic Overview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/products">
                  Browse Products
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Points Strip */}
      <section className="py-8 bg-blue-50 border-y">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            {[
              "Evidence-based summaries",
              "No medical claims",
              "Educational use only",
              "Shareable with patients",
            ].map((point, i) => (
              <div key={i} className="flex items-center gap-2 text-blue-800">
                <CheckCircle2 className="h-4 w-4" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Probiotics Overview */}
      <section id="probiotics-overview" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <FlaskConical className="h-8 w-8 text-blue-600" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold">
                  Probiotics & Prebiotics Overview
                </h2>
              </div>
              
              <div className="prose prose-lg max-w-none text-muted-foreground mb-8">
                <p>
                  <strong>Probiotics</strong> are live microorganisms that, when administered in 
                  adequate amounts, confer a health benefit on the host (FAO/WHO, 2001). They are 
                  found naturally in fermented foods and can also be taken as supplements.
                </p>
                <p>
                  <strong>Prebiotics</strong> are non-digestible food components that selectively 
                  stimulate the growth and/or activity of beneficial microorganisms in the gut. 
                  Common sources include dietary fibre from vegetables, fruits and whole grains.
                </p>
              </div>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-lg">Key Probiotic Genera in Fermented Foods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {[
                      { genus: "Lactobacillus", foods: "Kefir, yogurt, sauerkraut, kimchi" },
                      { genus: "Bifidobacterium", foods: "Some yogurts and fermented milks" },
                      { genus: "Saccharomyces", foods: "Kombucha, kefir, sourdough (yeast)" },
                      { genus: "Leuconostoc", foods: "Sauerkraut, kimchi, kefir" },
                      { genus: "Acetobacter", foods: "Kombucha, vinegar" },
                      { genus: "Streptococcus thermophilus", foods: "Yogurt, cheese" },
                    ].map((item, i) => (
                      <div key={i} className="p-3 bg-muted/50 rounded-lg">
                        <span className="font-medium italic">{item.genus}</span>
                        <span className="text-muted-foreground"> — {item.foods}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Patient-Friendly Link
                </h3>
                <p className="text-muted-foreground mb-4">
                  You can share this gut health guide with patients who want to learn more about 
                  fermented foods in an accessible, non-clinical format:
                </p>
                <Link 
                  to="/learn/gut-health-guide" 
                  className="text-blue-600 font-medium hover:underline"
                >
                  guthealth.co.za/learn/gut-health-guide →
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* EM1 & Soil Microbiology */}
      <section className="py-20 bg-gut-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Leaf className="h-8 w-8 text-amber-600" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold">
                  EM1 & Soil Microbiology
                </h2>
              </div>
              
              <div className="prose prose-lg max-w-none text-muted-foreground mb-8">
                <p>
                  <strong>EM1 (Effective Microorganisms 1)</strong> is a consortium of beneficial 
                  microorganisms including lactic acid bacteria, yeasts and photosynthetic bacteria. 
                  Originally developed for agricultural applications, EM technology aims to enhance 
                  soil microbial diversity and plant health.
                </p>
                <p>
                  While EM1 is primarily used in agriculture, some practitioners are interested in 
                  understanding the parallel between soil microbiome health and human gut microbiome health.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Agricultural Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      "Soil drench to improve microbial diversity in growing media",
                      "Foliar spray for plant resilience and nutrient uptake",
                      "Compost acceleration and odour reduction",
                      "Pond and dam water quality management (BioPond EM1)",
                      "Organic waste treatment and remediation",
                    ].map((app, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span>{app}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Algae Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Microscope className="h-8 w-8 text-teal-600" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold">
                  Live Algae Cultures
                </h2>
              </div>
              
              <div className="prose prose-lg max-w-none text-muted-foreground mb-8">
                <p>
                  <strong>Spirulina (Arthrospira platensis)</strong> and <strong>Chlorella 
                  (Chlorella vulgaris)</strong> are microalgae with documented nutritional profiles 
                  including protein, vitamins, minerals and antioxidants.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-teal-700">Spirulina</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2 text-muted-foreground">
                    <p>• 60-70% protein by dry weight</p>
                    <p>• Contains phycocyanin (blue pigment with antioxidant properties)</p>
                    <p>• Source of B vitamins, iron and gamma-linolenic acid</p>
                    <p>• Used in research, aquaculture and food applications</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-700">Chlorella</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2 text-muted-foreground">
                    <p>• 50-60% protein by dry weight</p>
                    <p>• Contains chlorophyll and Chlorella Growth Factor (CGF)</p>
                    <p>• Source of vitamins, minerals and nucleic acids</p>
                    <p>• Used in research, supplements and water treatment</p>
                  </CardContent>
                </Card>
              </div>

              <div className="p-6 bg-teal-50 rounded-xl border border-teal-200">
                <h3 className="font-semibold mb-3">Applications We Supply For</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Laboratory research",
                    "University projects",
                    "Aquaculture feed",
                    "Biofuel research",
                    "Supplement formulation",
                    "Educational demonstrations",
                  ].map((app, i) => (
                    <Badge key={i} variant="outline" className="border-teal-300 text-teal-700">
                      {app}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-8 w-8 text-blue-600" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold">
                  How to Share With Patients
                </h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: BookOpen,
                    title: "Educational Links",
                    desc: "Share our Gut Health Guide and Fermentation Starter Guide with patients interested in learning more."
                  },
                  {
                    icon: Stethoscope,
                    title: "No Medical Claims",
                    desc: "We make no therapeutic claims. Products are food-based cultures for those who wish to incorporate fermented foods."
                  },
                  {
                    icon: FileText,
                    title: "Disclaimers Included",
                    desc: "All our content includes appropriate disclaimers advising consultation with healthcare providers."
                  },
                ].map((item, i) => (
                  <Card key={i} className="text-center">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                        <item.icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 bg-amber-50 border-y border-amber-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="font-semibold mb-3 text-amber-800">Important Disclaimer</h3>
            <p className="text-sm text-amber-700">
              The information provided on this page and throughout our website is for educational 
              purposes only. We do not make medical claims about our products. Fermented foods and 
              probiotic cultures are traditional foods, not medicines. Healthcare professionals 
              should use their clinical judgment when discussing dietary changes with patients.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Questions or Bulk Orders?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            We're happy to discuss our products, provide additional information or arrange 
            bulk orders for clinics and educational institutions.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/contact">
                Contact Us
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/products">
                Browse Products
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