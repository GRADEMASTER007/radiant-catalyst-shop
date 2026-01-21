import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Leaf, 
  Globe, 
  Users, 
  Award, 
  Heart, 
  TrendingUp,
  MapPin,
  Calendar,
  Target,
  Sprout,
  Sun,
  Droplets
} from "lucide-react";

const milestones = [
  { year: "2008", title: "Founded", description: "DFSA established as South Africa's first dedicated dragon fruit nursery" },
  { year: "2012", title: "100+ Varieties", description: "Expanded collection to over 100 dragon fruit cultivars" },
  { year: "2015", title: "Export Operations", description: "Began exporting plants to neighboring African countries" },
  { year: "2018", title: "10 Year Anniversary", description: "Celebrated a decade of dragon fruit excellence" },
  { year: "2020", title: "Commercial Partnerships", description: "Launched commercial farm packages for large-scale operations" },
  { year: "2024", title: "Worldwide Export", description: "Now shipping premium cultivars to farmers worldwide" },
];

const values = [
  { icon: Leaf, title: "Quality Genetics", description: "We source and maintain the finest dragon fruit genetics from around the world" },
  { icon: Heart, title: "Passion for Pitaya", description: "Our love for dragon fruit drives everything we do" },
  { icon: Users, title: "Farmer Support", description: "We don't just sell plants - we support your farming journey" },
  { icon: Globe, title: "African Pride", description: "Proudly growing the dragon fruit industry across Africa" },
];

const stats = [
  { value: "16+", label: "Years Experience" },
  { value: "110+", label: "Cultivar Varieties" },
  { value: "8+", label: "Countries Served" },
  { value: "1000+", label: "Farmers Supported" },
];

const countries = [
  "South Africa", "Botswana", "Zambia", "Zimbabwe", "Uganda", "Namibia", "Malawi", "Worldwide"
];

const farmingTips = [
  { icon: Sun, title: "Full Sun", description: "Dragon fruit thrives in full sun with 6-8 hours of direct sunlight" },
  { icon: Droplets, title: "Well-Drained Soil", description: "Essential for healthy root development and preventing rot" },
  { icon: Sprout, title: "Support Structures", description: "Climbing cacti need sturdy posts or trellises to grow on" },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartSidebar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dragon-green/20 via-transparent to-dragon-pink/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.1),transparent_70%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Calendar className="h-4 w-4" />
              Since 2008
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Our{" "}
              <span className="text-gradient-tropical">Story</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Dragon Fruit Farming Africa (DFSA) is South Africa's premier dragon fruit nursery, 
              dedicated to establishing thriving farms across Africa and exporting premium cultivars worldwide.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-r from-dragon-green to-dragon-pink">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center text-white"
              >
                <p className="text-4xl md:text-5xl font-display font-bold">{stat.value}</p>
                <p className="text-white/80 text-sm mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Target className="h-4 w-4" />
                Our Mission
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Empowering African Farmers with Premium Dragon Fruit Genetics
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  At DFSA, we believe in the transformative power of dragon fruit farming. 
                  What started as a passion project in 2008 has grown into Africa's leading 
                  dragon fruit nursery, serving farmers from Cape Town to Kampala.
                </p>
                <p>
                  Our mission is simple: to provide the highest quality dragon fruit cultivars 
                  and the knowledge needed to grow them successfully. We work with both hobby 
                  growers starting their first plant and commercial farmers establishing 
                  large-scale operations.
                </p>
                <p>
                  As part of <strong>Healthy Fields</strong> and <strong>Dragon Fruit South Africa</strong>, 
                  we're committed to sustainable agriculture and helping farmers build profitable, 
                  environmentally-friendly businesses.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link to="/products">
                  <Button className="btn-sunset">Shop Cultivars</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline">Contact Us</Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-dragon-green/20 to-dragon-pink/20 p-8">
                <div className="w-full h-full rounded-2xl bg-muted flex items-center justify-center">
                  <div className="text-center p-8">
                    <Leaf className="h-24 w-24 text-primary mx-auto mb-4" />
                    <h3 className="font-display text-2xl font-bold text-gradient-tropical">DFSA</h3>
                    <p className="text-muted-foreground mt-2">Dragon Fruit Farming Africa</p>
                    <p className="text-sm text-muted-foreground">Since 2008</p>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-dragon-pink/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-dragon-green/20 rounded-full blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Our <span className="text-gradient-tropical">Values</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do at DFSA
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full glass-card hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dragon-green to-dragon-pink flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <value.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-display text-lg font-bold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Our <span className="text-gradient-tropical">Journey</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Key milestones in our 16+ year history
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-dragon-green via-dragon-pink to-dragon-green hidden md:block" />

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

      {/* Countries Section */}
      <section className="py-16 bg-gradient-to-br from-dragon-dark to-dragon-dark/90 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Globe className="h-6 w-6 text-dragon-lime" />
              <h2 className="font-display text-2xl md:text-3xl font-bold">We Serve Farmers Across Africa & Beyond</h2>
            </div>
            <p className="text-white/70 mb-8 max-w-2xl mx-auto">
              From our base in South Africa, we export premium dragon fruit plants to farmers across the continent and worldwide.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              {countries.map((country, index) => (
                <motion.span
                  key={country}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium"
                >
                  <MapPin className="h-3 w-3 text-dragon-lime" />
                  {country}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Growing Tips Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Dragon Fruit <span className="text-gradient-tropical">Growing Basics</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Essential tips for successful dragon fruit cultivation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {farmingTips.map((tip, index) => (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center glass-card">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <tip.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-8 md:p-12 rounded-3xl text-center max-w-3xl mx-auto bg-gradient-to-br from-dragon-green/10 to-dragon-pink/10"
          >
            <Award className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to Start Your Dragon Fruit Journey?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Whether you're a hobby grower or planning a commercial farm, we have the plants, 
              knowledge, and support to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products">
                <Button className="btn-sunset px-8">Browse Cultivars</Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="px-8">Book Consultation</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
