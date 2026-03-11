import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Leaf, 
  Droplets, 
  Sprout, 
  ArrowRight, 
  CheckCircle2,
  Fish,
  Recycle,
  TreePine
} from "lucide-react";

export default function FarmingEM1Guide() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-24 pt-32 bg-gradient-to-br from-amber-900/10 via-background to-gut-cream/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge className="mb-4 bg-amber-600 text-white">Farming & Growing</Badge>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              EM1 & Bio-Fertilizer{" "}
              <span className="text-amber-600">Guide</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Harness the power of effective microorganisms to regenerate your soil, 
              improve plant health and maintain clean ponds and dams.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild className="bg-amber-600 hover:bg-amber-700">
                <Link to="/products?category=farming-em1">
                  Shop EM1 Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">
                  Get Growing Advice
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What is EM1 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                What is EM1?
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground mb-8">
                <p>
                  <strong>EM1 (Effective Microorganisms 1)</strong> is a liquid culture containing 
                  a carefully balanced mix of beneficial microorganisms. Originally developed in 
                  Japan by Professor Teruo Higa, EM technology has been used worldwide for over 
                  30 years.
                </p>
                <p>
                  The core organisms in EM1 include:
                </p>
                <ul>
                  <li><strong>Lactic acid bacteria</strong> – produce organic acids that suppress harmful pathogens</li>
                  <li><strong>Yeasts</strong> – produce vitamins, amino acids and hormones that stimulate plant growth</li>
                  <li><strong>Photosynthetic bacteria</strong> – convert organic matter and sunlight into nutrients</li>
                </ul>
              </div>
            </motion.div>

            {/* Product Range */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              {[
                { 
                  name: "EM1 Standard", 
                  desc: "General purpose soil treatment for gardens and farms",
                  icon: Sprout,
                  color: "text-green-600 bg-green-100"
                },
                { 
                  name: "BioSoil EM1", 
                  desc: "Enhanced formula for intensive soil regeneration",
                  icon: Leaf,
                  color: "text-amber-600 bg-amber-100"
                },
                { 
                  name: "BioPond EM1", 
                  desc: "Water treatment for ponds, dams and aquaculture",
                  icon: Fish,
                  color: "text-blue-600 bg-blue-100"
                },
                { 
                  name: "BioGreen A-Z", 
                  desc: "Chlorella-based liquid fertilizer with full spectrum nutrients",
                  icon: Droplets,
                  color: "text-teal-600 bg-teal-100"
                },
              ].map((product, i) => (
                <motion.div
                  key={product.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className={`w-12 h-12 rounded-lg ${product.color} flex items-center justify-center mb-4`}>
                        <product.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold mb-2">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Application Methods */}
      <section className="py-20 bg-gut-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-center">
                How to Use EM1
              </h2>
              <p className="text-lg text-muted-foreground mb-12 text-center">
                EM1 can be applied in several ways depending on your needs.
              </p>

              <div className="space-y-6">
                {[
                  {
                    title: "Soil Drench",
                    desc: "Mix with water and apply directly to soil around plants",
                    ratio: "1:100 (10ml EM1 per 1L water)",
                    frequency: "Weekly or fortnightly",
                    tips: [
                      "Apply in the morning or evening, not during hot midday sun",
                      "Water soil before application for better absorption",
                      "Safe for all plants, vegetables and fruit trees",
                    ]
                  },
                  {
                    title: "Foliar Spray",
                    desc: "Spray directly onto leaves for faster nutrient uptake",
                    ratio: "1:500 to 1:1000 (more dilute than soil drench)",
                    frequency: "Weekly",
                    tips: [
                      "Spray early morning or late afternoon",
                      "Avoid spraying when plants are flowering",
                      "Especially good for stressed plants",
                    ]
                  },
                  {
                    title: "Compost Accelerator",
                    desc: "Add to compost heaps to speed up decomposition",
                    ratio: "1:100 dilution sprayed over compost layers",
                    frequency: "Each time you add new material",
                    tips: [
                      "Also reduces bad odours in the compost heap",
                      "Turn compost regularly for best results",
                      "Works with both hot and cold composting",
                    ]
                  },
                  {
                    title: "Pond & Dam Treatment",
                    desc: "Use BioPond EM1 to improve water quality",
                    ratio: "1L per 100,000L of water (initial dose)",
                    frequency: "Monthly maintenance at reduced rate",
                    tips: [
                      "Helps control algae blooms and bad odours",
                      "Safe for fish, plants and wildlife",
                      "Apply early morning for best results",
                    ]
                  },
                ].map((method, i) => (
                  <Card key={method.title}>
                    <CardHeader>
                      <CardTitle className="text-xl text-amber-700">{method.title}</CardTitle>
                      <p className="text-muted-foreground">{method.desc}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Dilution Ratio</div>
                          <div className="font-medium text-sm">{method.ratio}</div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Frequency</div>
                          <div className="font-medium text-sm">{method.frequency}</div>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {method.tips.map((tip, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <span>{tip}</span>
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

      {/* Use Cases */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-center">
                Who Uses EM1?
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: Sprout,
                    title: "Home Gardeners",
                    points: [
                      "Vegetable patches and herb gardens",
                      "Indoor plants and potted containers",
                      "Lawn care and composting",
                    ]
                  },
                  {
                    icon: TreePine,
                    title: "Market Gardeners",
                    points: [
                      "Organic vegetable production",
                      "Tunnel and greenhouse growing",
                      "Crop rotation and soil building",
                    ]
                  },
                  {
                    icon: Recycle,
                    title: "Commercial Farms",
                    points: [
                      "Regenerative agriculture",
                      "Livestock and poultry operations",
                      "Orchard and vineyard management",
                    ]
                  },
                ].map((user, i) => (
                  <Card key={user.title} className="h-full">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                        <user.icon className="h-6 w-6 text-amber-600" />
                      </div>
                      <h3 className="font-semibold mb-3">{user.title}</h3>
                      <ul className="space-y-2">
                        {user.points.map((point, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
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

      {/* Seeds & Growing Supplies */}
      <section className="py-20 bg-gut-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                Seeds & Growing Supplies
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We also stock bulk seeds and supplies for organic growers.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Wheatgrass Seeds</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Bulk wheatgrass seeds for juicing, growing trays and animal feed.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {["5kg", "10kg", "25kg", "50kg"].map((size) => (
                        <Badge key={size} variant="outline">{size}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Also available: Fresh wheatgrass trays at R80 each, grown in organic soil.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Soya Beans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Food-grade soya beans for tempeh, natto, tofu and soy milk.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {["5kg", "10kg", "25kg", "50kg"].map((size) => (
                        <Badge key={size} variant="outline">{size}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Perfect for home fermenters and small-scale producers.
                    </p>
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Diatomaceous Earth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Food-grade diatomaceous earth for natural pest control, garden use 
                      and general wellness support.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {["1kg tub", "10kg bag", "25kg bag"].map((size) => (
                        <Badge key={size} variant="outline">{size}</Badge>
                      ))}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Garden Uses</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Natural pest control for slugs, ants, aphids</li>
                          <li>• Safe around pets and wildlife</li>
                          <li>• Soil amendment and moisture retention</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Household Uses</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Flea and tick control for pets</li>
                          <li>• Odour control and dehumidifying</li>
                          <li>• General detox support (food grade only)</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-amber-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Start Growing Healthier Plants
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Explore our range of EM1 products, bio-fertilizers, seeds and growing supplies.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/products?category=farming-em1">
                Shop EM1 & Fertilizers
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/products?category=seeds-growing">
                Shop Seeds & Supplies
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