import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { motion } from 'framer-motion';
import { Truck, Shield, Headphones, CreditCard } from 'lucide-react';

const features = [
  { icon: Truck, title: 'Fast Delivery', description: 'Nationwide shipping with tracking' },
  { icon: Shield, title: 'Secure Payment', description: 'PayFast & Yoco integration' },
  { icon: Headphones, title: '24/7 Support', description: 'WhatsApp & email support' },
  { icon: CreditCard, title: 'Easy Returns', description: '30-day return policy' },
];

const Index = () => {
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

        {/* Newsletter Section */}
        <section className="py-20 bg-gradient-to-r from-primary to-sunset-orange text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Join Our African Craft Community
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Subscribe for exclusive deals, new arrivals, and stories behind our artisan crafts.
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button type="submit" className="btn-earth">
                  Subscribe
                </button>
              </form>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-earth-brown text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-display text-2xl font-bold text-sahara-gold mb-4">African Vibe</h3>
                <p className="text-white/70 text-sm">Authentic African craftsmanship delivered to your doorstep.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li><a href="/products" className="hover:text-white transition-colors">Shop All</a></li>
                  <li><a href="/categories" className="hover:text-white transition-colors">Categories</a></li>
                  <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Customer Service</h4>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="/shipping" className="hover:text-white transition-colors">Shipping Info</a></li>
                  <li><a href="/returns" className="hover:text-white transition-colors">Returns</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li>orders@proagrisa.co.za</li>
                  <li>+27 83 447 4639</li>
                  <li>South Africa</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/50 text-sm">
              © 2026 African Vibe. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
