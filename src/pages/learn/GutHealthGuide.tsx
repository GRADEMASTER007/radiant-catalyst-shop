import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Leaf, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  Brain,
  Shield,
  Zap
} from "lucide-react";

export default function GutHealthGuide() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="The Complete Gut Health Guide | Probiotics & Microbiome SA"
        description="Science-backed guide to restoring gut health with live probiotic cultures, kefir, kombucha, and fermented foods. Learn how the microbiome affects immunity, mood, and metabolism."
        canonical="https://purelyhealthnutra.com/learn/gut-health-guide"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-24 pt-32 bg-gradient-to-br from-gut-green/10 via-background to-gut-cream/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge className="mb-4 bg-gut-green text-white">Health & Wellness</Badge>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Your Complete Guide to{" "}
              <span className="text-gut-green">Gut Health</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Understand your microbiome, discover the power of fermented foods, and learn 
              simple daily habits that support digestion, immunity and overall wellbeing.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild className="bg-gut-green hover:bg-gut-forest">
                <Link to="/products?category=fermented-foods">
                  Shop Probiotic Cultures
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/learn/fermentation-guide">
                  Start Fermenting
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What is Gut Health */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                What is Gut Health?
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>
                  Your gut is home to trillions of microorganisms—bacteria, fungi, viruses and other 
                  microbes—collectively known as your <strong>gut microbiome</strong>. This complex 
                  ecosystem plays a crucial role in digestion, nutrient absorption, immune function, 
                  and even mental health.
                </p>
                <p>
                  When your gut microbiome is balanced and diverse, you're more likely to experience 
                  good digestion, stable energy levels, strong immunity and clear thinking. When it's 
                  out of balance (a state called dysbiosis), you might experience bloating, fatigue, 
                  mood changes or frequent illness.
                </p>
              </div>
            </motion.div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              {[
                { icon: Heart, title: "Digestion", desc: "Break down food efficiently and absorb nutrients" },
                { icon: Shield, title: "Immunity", desc: "70% of immune cells live in your gut" },
                { icon: Brain, title: "Mood & Mind", desc: "Gut-brain axis influences mental wellbeing" },
                { icon: Zap, title: "Energy", desc: "Better nutrient absorption means more vitality" },
              ].map((benefit, i) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-gut-green/20">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-gut-green/10 flex items-center justify-center mx-auto mb-4">
                        <benefit.icon className="h-6 w-6 text-gut-green" />
                      </div>
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Fermented Foods Section */}
      <section className="py-20 bg-gut-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Leaf className="h-8 w-8 text-gut-green" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold">
                  The Power of Fermented Foods
                </h2>
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground mb-8">
                <p>
                  Fermented foods have been part of human diets for thousands of years. They're 
                  created when beneficial bacteria and yeasts break down sugars and starches, 
                  producing organic acids, vitamins and probiotics in the process.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    title: "Kefir",
                    desc: "A tangy, probiotic-rich drink made by fermenting milk or water with kefir grains. Contains dozens of beneficial bacteria strains.",
                    link: "/products?category=fermented-foods"
                  },
                  {
                    title: "Kombucha",
                    desc: "Fermented tea made with a SCOBY (symbiotic culture of bacteria and yeast). Refreshing and naturally fizzy.",
                    link: "/products?category=fermented-foods"
                  },
                  {
                    title: "Yogurt",
                    desc: "Milk fermented with specific bacterial cultures. A familiar probiotic food enjoyed worldwide.",
                    link: "/products?category=fermented-foods"
                  },
                  {
                    title: "Sourdough",
                    desc: "Bread made with a natural starter culture. Easier to digest than regular bread due to pre-fermentation.",
                    link: "/products?category=fermented-foods"
                  },
                ].map((food, i) => (
                  <motion.div
                    key={food.title}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-2">{food.title}</h3>
                        <p className="text-muted-foreground mb-4">{food.desc}</p>
                        <Link 
                          to={food.link}
                          className="text-gut-green font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
                        >
                          Shop {food.title} Cultures
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Daily Habits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-8 w-8 text-gut-green" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold">
                  Day-to-Day Gut Health Habits
                </h2>
              </div>
              <p className="text-lg text-muted-foreground mb-8">
                Small daily actions can make a big difference to your microbiome over time.
              </p>

              <div className="space-y-4">
                {[
                  "Start your day with a glass of water, then add kefir or yogurt to breakfast",
                  "Include fermented foods with at least one meal daily",
                  "Eat a variety of plant foods – aim for 30 different types per week",
                  "Reduce processed foods and added sugars which can harm beneficial bacteria",
                  "Manage stress through movement, rest and activities you enjoy",
                  "Get enough sleep – your microbiome has a circadian rhythm too",
                  "Consider wheatgrass or spirulina as a daily green boost",
                ].map((habit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-4 rounded-lg bg-gut-green/5 border border-gut-green/10"
                  >
                    <CheckCircle2 className="h-5 w-5 text-gut-green mt-0.5 flex-shrink-0" />
                    <span>{habit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> This information is for educational purposes only and 
              is not intended as medical advice. Always consult your healthcare provider before 
              making significant changes to your diet or if you have specific health concerns.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gut-green text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Gut Health Journey?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Explore our range of live probiotic cultures, fermentation kits and superfoods.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/products?category=fermented-foods">
                Shop Cultures
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/learn/fermentation-guide">
                Fermentation Guide
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