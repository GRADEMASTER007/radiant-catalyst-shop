import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { motion } from 'framer-motion';
import { 
  Sprout, 
  Shield, 
  Truck, 
  Timer,
  CheckCircle2,
  Package,
  Phone,
  Leaf,
  ThermometerSun,
  Droplets,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';

const rootingPackages = [
  {
    id: 'basic',
    name: 'Basic Rooting',
    pricePerCutting: 'R25',
    minQuantity: 10,
    timeline: '6-8 weeks',
    icon: Sprout,
    gradient: 'from-emerald-500 to-teal-600',
    features: [
      'Standard rooting medium',
      'Basic root development',
      'Quality inspection',
      'Collection notification',
      'Care instructions'
    ],
    includes: 'Standard pot & medium'
  },
  {
    id: 'premium',
    name: 'Premium Rooting',
    pricePerCutting: 'R45',
    minQuantity: 5,
    timeline: '8-10 weeks',
    icon: Leaf,
    gradient: 'from-primary to-dragon-magenta',
    popular: true,
    features: [
      'Premium rooting hormone',
      'Enhanced root mass',
      'Mycorrhizal treatment',
      'Progress photos',
      'Hardening period included',
      'Detailed care guide',
      'WhatsApp support'
    ],
    includes: 'Premium pot, medium & fertilizer'
  },
  {
    id: 'commercial',
    name: 'Commercial Contract',
    pricePerCutting: 'R35',
    minQuantity: 100,
    timeline: '10-12 weeks',
    icon: Package,
    gradient: 'from-amber-500 to-orange-600',
    features: [
      'Bulk pricing advantage',
      'Scheduled delivery batches',
      'Custom variety selection',
      'Phytosanitary certificates',
      'Farm-ready conditioning',
      'Planting support visit',
      'Priority supply guarantee'
    ],
    includes: 'Bulk packaging & documentation'
  }
];

const process = [
  {
    step: 1,
    title: 'Submit Your Cuttings',
    description: 'Drop off or courier your unrooted cuttings to our facility. We accept cuttings from 15-40cm in length.',
    icon: Package
  },
  {
    step: 2,
    title: 'Treatment & Planting',
    description: 'Cuttings are treated with rooting hormone and fungicide, then planted in our specialized medium.',
    icon: Droplets
  },
  {
    step: 3,
    title: 'Controlled Environment',
    description: 'Your cuttings develop roots in our climate-controlled shade house with optimal humidity and temperature.',
    icon: ThermometerSun
  },
  {
    step: 4,
    title: 'Collection / Delivery',
    description: 'Once fully rooted and hardened, collect your plants or we deliver nationwide.',
    icon: Truck
  }
];

const faqs = [
  {
    question: 'How long does rooting take?',
    answer: 'Basic rooting takes 6-8 weeks, premium 8-10 weeks, and commercial batches 10-12 weeks. Timing varies by variety and season.'
  },
  {
    question: 'Can I send cuttings by courier?',
    answer: 'Yes! Package cuttings in newspaper, ensure good ventilation, and ship via overnight courier. Contact us for packaging guidelines.'
  },
  {
    question: 'What is your success rate?',
    answer: 'We maintain a 95%+ success rate. Any cuttings that fail to root are replaced at no charge or refunded.'
  },
  {
    question: 'Do you offer nationwide delivery?',
    answer: 'Yes, we deliver rooted plants throughout South Africa and export to select African countries with proper documentation.'
  },
  {
    question: 'Can you root rare varieties?',
    answer: 'Absolutely! We specialize in rare and exotic varieties. Some may require additional time or have adjusted pricing.'
  }
];

export default function RootingServices() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    package: '',
    quantity: '',
    varieties: '',
    hasOwnCuttings: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPackage = rootingPackages.find(p => p.id === formData.package);
    const message = `Hi DFSA! I'm interested in your rooting services.

📦 Package: ${selectedPackage?.name || 'Not selected'}
📊 Quantity: ${formData.quantity} cuttings
🌱 Varieties: ${formData.varieties}
🪴 Own Cuttings: ${formData.hasOwnCuttings}

👤 Name: ${formData.name}
📧 Email: ${formData.email}
📱 Phone: ${formData.phone}
📍 Location: ${formData.location}

Message: ${formData.message}`;
    
    window.open(`https://wa.me/27834474639?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartSidebar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-primary/10 to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <span className="inline-block px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium mb-6">
                Professional Plant Propagation
              </span>
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
                Rooting <span className="text-gradient-dragon">Services</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Let our experts root your dragon fruit cuttings with a 95%+ success rate. 
                Send us your cuttings or choose from our 110+ varieties.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <WhatsAppButton message="Hi! I'm interested in your rooting services. Can you tell me more about your packages and process?">
                  Get Started Today
                </WhatsAppButton>
                <Button variant="outline" size="lg" asChild>
                  <a href="#packages">View Packages</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Banner */}
        <section className="py-8 bg-primary/10">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {[
                { value: '95%+', label: 'Success Rate' },
                { value: '110+', label: 'Varieties Available' },
                { value: '6-12', label: 'Weeks Timeline' },
                { value: '10,000+', label: 'Plants Rooted Annually' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-gradient-dragon">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                How It <span className="text-gradient-dragon">Works</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our professional rooting process ensures your cuttings develop strong, healthy root systems.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {process.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full glass-card border-border/50 relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-6xl font-bold text-primary/10">
                      {item.step}
                    </div>
                    <CardContent className="p-6 relative z-10">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-dragon-magenta flex items-center justify-center mb-4">
                        <item.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Packages Grid */}
        <section id="packages" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Rooting <span className="text-gradient-dragon">Packages</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose the package that fits your needs. All packages include our quality guarantee.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {rootingPackages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        Recommended
                      </span>
                    </div>
                  )}
                  <Card className={`h-full ${pkg.popular ? 'border-primary border-2 shadow-lg shadow-primary/20' : 'border-border/50'} hover:border-primary/50 transition-all`}>
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center mx-auto mb-4`}>
                        <pkg.icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">{pkg.name}</CardTitle>
                      <CardDescription>Min. {pkg.minQuantity} cuttings</CardDescription>
                      <div className="pt-4">
                        <span className="text-3xl font-bold text-gradient-dragon">{pkg.pricePerCutting}</span>
                        <span className="text-muted-foreground">/cutting</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                        <Timer className="h-4 w-4" />
                        {pkg.timeline}
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">{pkg.includes}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {pkg.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full" 
                        variant={pkg.popular ? 'default' : 'outline'}
                        onClick={() => setFormData(prev => ({ ...prev, package: pkg.id }))}
                      >
                        Select Package
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Guarantee Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12"
            >
              <Card className="bg-gradient-to-r from-primary/20 to-dragon-magenta/20 border-primary/30">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
                  <Shield className="h-12 w-12 text-primary shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg">Our Rooting Guarantee</h3>
                    <p className="text-muted-foreground">
                      If any cutting fails to root due to our process, we'll replace it free of charge or refund your fee.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Booking Form */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                  Start Your <span className="text-gradient-dragon">Order</span>
                </h2>
                <p className="text-muted-foreground">
                  Tell us about your rooting needs and we'll provide a custom quote.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card-strong">
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            placeholder="Your name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            required
                            maxLength={255}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+27 XX XXX XXXX"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            required
                            maxLength={20}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location / Country *</Label>
                          <Input
                            id="location"
                            placeholder="City, Country"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            required
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="package">Rooting Package *</Label>
                          <Select
                            value={formData.package}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, package: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a package" />
                            </SelectTrigger>
                            <SelectContent>
                              {rootingPackages.map(pkg => (
                                <SelectItem key={pkg.id} value={pkg.id}>
                                  {pkg.name} - {pkg.pricePerCutting}/cutting
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Number of Cuttings *</Label>
                          <Input
                            id="quantity"
                            type="number"
                            placeholder="e.g., 50"
                            value={formData.quantity}
                            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                            required
                            min={1}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hasOwnCuttings">Do you have your own cuttings?</Label>
                        <Select
                          value={formData.hasOwnCuttings}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, hasOwnCuttings: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes-dropoff">Yes, I'll drop them off</SelectItem>
                            <SelectItem value="yes-courier">Yes, I'll courier them</SelectItem>
                            <SelectItem value="no-buy">No, I want to buy cuttings from DFSA</SelectItem>
                            <SelectItem value="mixed">Mixed - some of each</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="varieties">Varieties (if known)</Label>
                        <Input
                          id="varieties"
                          placeholder="e.g., Physical Graffiti, American Beauty, Vietnam White"
                          value={formData.varieties}
                          onChange={(e) => setFormData(prev => ({ ...prev, varieties: e.target.value }))}
                          maxLength={500}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Additional Information</Label>
                        <Textarea
                          id="message"
                          placeholder="Any special requirements, questions, or details about your cuttings..."
                          value={formData.message}
                          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                          rows={4}
                          maxLength={1000}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button type="submit" size="lg" className="flex-1 btn-dragon">
                          Send via WhatsApp
                        </Button>
                        <Button type="button" variant="outline" size="lg" asChild>
                          <a href="tel:+27834474639">
                            <Phone className="h-5 w-5 mr-2" />
                            Call Instead
                          </a>
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Frequently Asked <span className="text-gradient-dragon">Questions</span>
              </h2>
            </motion.div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-card border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <AlertCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                        <div>
                          <h3 className="font-bold mb-2">{faq.question}</h3>
                          <p className="text-muted-foreground text-sm">{faq.answer}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
