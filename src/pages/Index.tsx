import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { AudienceSection } from '@/components/home/AudienceSection';
import { ShippingBanner } from '@/components/home/ShippingBanner';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Testimonials } from '@/components/home/Testimonials';
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget';
import { motion } from 'framer-motion';
import { Truck, Shield, Headphones, RefreshCw, Leaf, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const features = [
  { icon: Truck, title: 'Fast Delivery', description: 'Nationwide & Africa shipping' },
  { icon: Shield, title: 'Secure Payment', description: 'PayFast & Yoco integration' },
  { icon: Headphones, title: '24/7 Support', description: 'WhatsApp & email support' },
  { icon: RefreshCw, title: 'Live Cultures', description: 'Guaranteed fresh & active' },
];

const Index = () => {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartSidebar />
      
      <main>
        <HeroSection />
        
        {/* Features Bar - Premium Styling */}
        <section className="bg-gradient-to-r from-[#0B3D2E] via-[#0F4C3A] to-[#0B3D2E] py-6 relative overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#22C55E]/20 flex items-center justify-center group-hover:bg-[#22C55E]/30 transition-colors">
                    <feature.icon className="h-6 w-6 text-[#4ADE80]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{feature.title}</h4>
                    <p className="text-sm text-white/60">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <CategoryGrid />
        <FeaturedProducts />
        <AudienceSection />
        <ShippingBanner />
        <Testimonials />

        {/* Newsletter Section - Premium Styling */}
        <section className="py-24 bg-gradient-to-br from-[#0B3D2E] via-[#0F4C3A] to-[#0B3D2E] relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#22C55E]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#3B82F6]/10 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 border border-white/20">
                <Leaf className="w-4 h-4 text-[#4ADE80]" />
                <span className="text-sm font-medium text-white/80">Join Our Community</span>
              </div>
              
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-5 text-white">
                Join the Gut Health Community
              </h2>
              <p className="text-white/70 mb-10 max-w-2xl mx-auto text-lg">
                Subscribe for fermentation tips, recipes, research updates and exclusive offers on probiotics, cultures and EM1 products.
              </p>
              
              <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 h-14 px-6 rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#22C55E] focus:ring-[#22C55E]/20"
                />
                <Button 
                  type="submit" 
                  size="lg"
                  className="h-14 px-8 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold"
                >
                  Subscribe
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </motion.div>
          </div>
        </section>

        <AIAssistantWidget />

        {/* Footer - Premium Styling */}
        <footer className="bg-[#0B3D2E] text-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-10">
              <div>
                <h3 className="font-serif text-2xl font-bold mb-2">
                  <span className="text-[#4ADE80]">Gut Health</span> Probiotics
                </h3>
                <p className="text-sm text-white/60 mb-4">South Africa</p>
                <p className="text-xs text-white/40 leading-relaxed">
                  Healthy Fields SA – Natural wellness from the earth to your home. 
                  Live cultures, organic growing and bio-fertilizers for homes, clinics and farms.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-5 text-[#4ADE80]">Quick Links</h4>
                <ul className="space-y-3 text-white/60 text-sm">
                  <li><Link to="/products" className="hover:text-white transition-colors">Shop All</Link></li>
                  <li><Link to="/products?category=fermented-foods" className="hover:text-white transition-colors">Fermented Foods</Link></li>
                  <li><Link to="/products?category=bio-fertilizers" className="hover:text-white transition-colors">EM1 & Farming</Link></li>
                  <li><Link to="/products?category=algae-superfoods" className="hover:text-white transition-colors">Algae Cultures</Link></li>
                  <li><Link to="/blog" className="hover:text-white transition-colors">Blog & Recipes</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-5 text-[#4ADE80]">We Ship To</h4>
                <ul className="space-y-2 text-white/60 text-sm">
                  <li>🇿🇦 South Africa</li>
                  <li>🇧🇼 Botswana • 🇿🇲 Zambia</li>
                  <li>🇿🇼 Zimbabwe • 🇳🇦 Namibia</li>
                  <li>🇲🇿 Mozambique • 🇺🇬 Uganda</li>
                  <li>🇰🇪 Kenya</li>
                  <li className="text-[#4ADE80] font-medium pt-2">🌍 Worldwide Export Available</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-5 text-[#4ADE80]">Contact</h4>
                <ul className="space-y-3 text-white/60 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-[#4ADE80]">📧</span>
                    admin@proagrisa.co.za
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#4ADE80]">📱</span>
                    +27 83 447 4639
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#4ADE80]">📞</span>
                    +1 351 777 2848
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white/40 text-sm">
              <span>© 2026 Gut Health Probiotics South Africa. Healthy Fields SA. All rights reserved.</span>
              {isAdmin && (
                <Link to="/admin" className="text-[#4ADE80] hover:text-white transition-colors text-xs font-medium">
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
