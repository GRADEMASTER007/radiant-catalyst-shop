import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Testimonials } from '@/components/home/Testimonials';
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget';
import { motion } from 'framer-motion';
import { Truck, Shield, Headphones, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

const features = [
  { icon: Truck, title: 'Fast Delivery', description: 'Nationwide shipping with tracking' },
  { icon: Shield, title: 'Secure Payment', description: 'PayFast & Yoco integration' },
  { icon: Headphones, title: '24/7 Support', description: 'WhatsApp & email support' },
  { icon: CreditCard, title: 'Easy Returns', description: '30-day return policy' },
];

const Index = () => {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen">
      <Header />
      <CartSidebar />
      
      <main>
        <HeroSection />
        
        {/* Features Bar */}
        <section className="bg-earth-brown text-white py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <feature.icon className="h-8 w-8 text-sahara-gold flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <FeaturedProducts />
        
        <Testimonials />

        {/* Newsletter Section */}
        <section className="py-20 bg-gradient-to-r from-dragon-green to-dragon-pink text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Join the Dragon Fruit Farming Community
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Subscribe for exclusive deals, farming tips, and updates on new cultivars.
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button type="submit" className="btn-sunset">
                  Subscribe
                </button>
              </form>
            </motion.div>
          </div>
        </section>

        {/* AI Assistant Widget */}
        <AIAssistantWidget />

        {/* Footer */}
        <footer className="bg-dragon-dark text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-display text-2xl font-bold text-gradient-tropical mb-2">DFSA</h3>
                <p className="text-sm text-white/70 mb-2">Dragon Fruit Farming Africa</p>
                <p className="text-xs text-white/50">Dragon Fruit South Africa & Healthy Fields</p>
                <p className="text-xs text-white/50 mt-1">Since 2008</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-dragon-lime">Quick Links</h4>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li><a href="/products" className="hover:text-white transition-colors">Shop Cultivars</a></li>
                  <li><a href="/products?category=commercial-farm-packages" className="hover:text-white transition-colors">Commercial Packages</a></li>
                  <li><a href="/products?category=services-memberships" className="hover:text-white transition-colors">Consultations</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-dragon-lime">Countries</h4>
                <ul className="space-y-1 text-white/70 text-xs">
                  <li>South Africa • Botswana</li>
                  <li>Zambia • Zimbabwe</li>
                  <li>Uganda • Namibia • Malawi</li>
                  <li className="text-dragon-pink">Worldwide Export</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-dragon-lime">Contact</h4>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li>admin@proagrisa.co.za</li>
                  <li>+27 83 447 4639</li>
                  <li>+1 351 777 2848</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white/50 text-sm">
              <span>© 2026 Dragon Fruit Farming Africa (DFSA). Since 2008. All rights reserved.</span>
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="text-dragon-pink hover:text-white transition-colors text-xs"
                >
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
