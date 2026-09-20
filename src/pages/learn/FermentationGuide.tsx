import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Utensils, 
  Clock, 
  ThermometerSun, 
  ArrowRight, 
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Package
} from "lucide-react";

export default function FermentationGuide() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Home Fermentation Guide | Kefir, Kombucha & Sauerkraut Tips"
        description="Step-by-step home fermentation guide for kefir, kombucha, sauerkraut, and ginger bug. Temperatures, ratios, troubleshooting, and safety from South Africa's culture experts."
        canonical="https://livingculturehealth.com/learn/fermentation-guide"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-24 pt-32 bg-gradient-to-br from-pink-900/10 via-background to-gut-cream/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge className="mb-4 bg-pink-600 text-white">Recipes & Guides</Badge>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Fermentation{" "}
              <span className="text-pink-600">Starter Guide</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Step-by-step instructions for making kefir, kombucha, yogurt and sourdough at home. 
              Plus equipment checklists and safety basics.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild className="bg-pink-600 hover:bg-pink-700">
                <Link to="/products?category=diy-kits">
                  Shop Starter Kits
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/products?category=fermented-foods">
                  Browse Cultures
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Equipment Checklist */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Package className="h-8 w-8 text-pink-600" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold">
                  Equipment Checklist
                </h2>
              </div>
              <p className="text-lg text-muted-foreground mb-8">
                Before you start, gather these basic supplies. Most fermentation projects 
                need simple, affordable equipment.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Essential Equipment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {[
                        "Glass jars (1L or larger) with wide mouths",
                        "Fine mesh strainer (plastic or stainless steel)",
                        "Wooden or plastic spoon (avoid metal with cultures)",
                        "Breathable cloth covers (muslin or cheesecloth)",
                        "Rubber bands to secure covers",
                        "Measuring cups and spoons",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-pink-600 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nice to Have</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {[
                        "Nut milk bag for straining",
                        "pH strips or meter",
                        "Thermometer",
                        "Flip-top bottles for secondary fermentation",
                        "Heating mat for cooler climates",
                        "Labels and marker for dating batches",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 p-6 bg-pink-50 rounded-xl border border-pink-200">
                <h3 className="font-semibold mb-3">💡 Pro Tip</h3>
                <p className="text-muted-foreground">
                  Start with our <Link to="/products?category=diy-kits" className="text-pink-600 font-medium hover:underline">Complete Fermentation Starter Kit</Link> which 
                  includes a strainer set, nut milk bag, cheesecloth and detailed instructions.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Kefir Guide */}
      <section className="py-20 bg-gut-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Droplets className="h-8 w-8 text-gut-green" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold">
                  How to Make Milk Kefir
                </h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <Clock className="h-5 w-5 text-gut-green" />
                  <div>
                    <div className="font-medium">Time</div>
                    <div className="text-sm text-muted-foreground">24-48 hours</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <ThermometerSun className="h-5 w-5 text-gut-green" />
                  <div>
                    <div className="font-medium">Temperature</div>
                    <div className="text-sm text-muted-foreground">18-25°C</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <Utensils className="h-5 w-5 text-gut-green" />
                  <div>
                    <div className="font-medium">Difficulty</div>
                    <div className="text-sm text-muted-foreground">Beginner</div>
                  </div>
                </div>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Step-by-Step Instructions</h3>
                  <ol className="space-y-4">
                    {[
                      "Place 1-2 tablespoons of milk kefir grains in a clean glass jar.",
                      "Add 500ml of fresh milk (full cream works best). Leave some headspace.",
                      "Cover with a breathable cloth and secure with a rubber band.",
                      "Leave at room temperature (18-25°C) for 24-48 hours, away from direct sunlight.",
                      "The kefir is ready when it has thickened slightly and smells tangy. It may separate—that's normal!",
                      "Strain through a fine mesh strainer into a clean container. The grains stay in the strainer.",
                      "Store your kefir in the fridge. Add the grains to fresh milk to start a new batch.",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gut-green text-white flex items-center justify-center font-bold text-sm">
                          {i + 1}
                        </span>
                        <span className="pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Day-to-Day Use</h4>
                  <p className="text-sm text-green-700">
                    Drink 1 glass (200ml) daily with breakfast. Add to smoothies, pour over 
                    granola, or blend with fruit. Start with small amounts if new to kefir.
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-2">Storage Tips</h4>
                  <p className="text-sm text-amber-700">
                    Finished kefir keeps 1-2 weeks refrigerated. Grains can be stored in milk 
                    in the fridge for up to 2 weeks if you need a break.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Kombucha Guide */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Droplets className="h-8 w-8 text-amber-600" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold">
                  How to Make Kombucha
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-medium">Time</div>
                    <div className="text-sm text-muted-foreground">7-14 days</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <ThermometerSun className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-medium">Temperature</div>
                    <div className="text-sm text-muted-foreground">20-30°C</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Utensils className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-medium">Difficulty</div>
                    <div className="text-sm text-muted-foreground">Intermediate</div>
                  </div>
                </div>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Step-by-Step Instructions</h3>
                  <ol className="space-y-4">
                    {[
                      "Brew 1L of tea (black, green, or rooibos). Add 80-100g sugar while hot. Stir to dissolve.",
                      "Let the sweet tea cool completely to room temperature. Hot tea will kill your SCOBY!",
                      "Pour cooled tea into a clean glass jar. Add your SCOBY and 100ml starter liquid.",
                      "Cover with breathable cloth and secure. Place in a warm spot away from direct sunlight.",
                      "Ferment for 7-14 days. Taste after 7 days—longer = more sour, less sweet.",
                      "When ready, remove the SCOBY. Reserve 100ml as starter for your next batch.",
                      "Optional: bottle with fruit/ginger for secondary fermentation (2-3 days) to add fizz.",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                          {i + 1}
                        </span>
                        <span className="pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section className="py-20 bg-red-50 border-y border-red-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-red-800">
                  Safety Basics
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    title: "Cleanliness is Key",
                    points: [
                      "Always wash hands before handling cultures",
                      "Use clean jars and equipment",
                      "Avoid cross-contamination between batches",
                    ]
                  },
                  {
                    title: "Watch for Problems",
                    points: [
                      "Discard if you see black, green or fuzzy mould",
                      "Bad smells (rotting, not just sour) mean something's wrong",
                      "When in doubt, throw it out and start fresh",
                    ]
                  },
                  {
                    title: "Temperature Matters",
                    points: [
                      "Too cold = slow fermentation, potential issues",
                      "Too hot = dead cultures",
                      "Aim for consistent room temperature",
                    ]
                  },
                  {
                    title: "Start Slowly",
                    points: [
                      "Introduce fermented foods gradually to your diet",
                      "Some digestive adjustment is normal at first",
                      "Consult your doctor if you have specific health concerns",
                    ]
                  },
                ].map((section, i) => (
                  <Card key={i} className="border-red-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-red-800">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {section.points.map((point, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-red-700">
                            <span>•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-pink-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Fermenting?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Get everything you need to begin your fermentation journey.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/products?category=diy-kits">
                Shop Starter Kits
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/products?category=fermented-foods">
                Browse Cultures
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