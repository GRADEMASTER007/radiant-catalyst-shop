import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import audience images
import audienceHouseholds from '@/assets/audience-households.jpg';
import audienceMoms from '@/assets/audience-moms.jpg';
import audiencePractitioners from '@/assets/audience-practitioners.jpg';
import audienceFarmers from '@/assets/audience-farmers.jpg';
import audienceResearchers from '@/assets/audience-researchers.jpg';

const audiences = [
  {
    title: 'Households & Families',
    description: 'Simple daily rituals for better gut health. Start with kefir, kombucha or yogurt for the whole family.',
    cta: 'Shop Starter Kits',
    href: '/products?category=fermented-foods',
    image: audienceHouseholds,
    accent: '#22C55E',
  },
  {
    title: 'Pregnant & Postpartum Moms',
    description: 'Gentle, food-based cultures for expecting and nursing mothers. Always consult your healthcare provider.',
    cta: 'Gentle Cultures',
    href: '/products?tag=pregnancy-safe',
    image: audienceMoms,
    accent: '#EC4899',
  },
  {
    title: 'Doctors & Practitioners',
    description: 'Science-aware explanations and links you can share with patients. No pseudoscience, just practical info.',
    cta: 'For Practitioners',
    href: '/learn/for-practitioners',
    image: audiencePractitioners,
    accent: '#3B82F6',
  },
  {
    title: 'Farmers & Growers',
    description: 'Bio-fertilizers, EM1 and seeds for regenerative, living soils. From small gardens to commercial farms.',
    cta: 'Shop EM1 Range',
    href: '/products?category=bio-fertilizers',
    image: audienceFarmers,
    accent: '#D97706',
  },
  {
    title: 'Labs, Universities & Researchers',
    description: 'Live spirulina & chlorella cultures, plus algae fertilizers for experiments, biofuel and aquaculture projects.',
    cta: 'Algae Cultures',
    href: '/products?category=algae-superfoods',
    image: audienceResearchers,
    accent: '#06B6D4',
  },
];

export function AudienceSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-[#0B3D2E] to-[#0F4C3A] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span 
            className="inline-block text-[#4ADE80] font-semibold tracking-[0.2em] uppercase text-sm mb-3"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Who We Serve
          </motion.span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-white">
            Solutions for <span className="text-[#4ADE80]">Every Need</span>
          </h2>
          <p className="text-white/70 max-w-3xl mx-auto text-lg leading-relaxed">
            Whether you're a health-conscious home user, a medical professional, 
            or a commercial farmer, we have the products and expertise to support your journey.
          </p>
        </motion.div>

        {/* Audience Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <Link to={audience.href} className="block h-full">
                <div className="relative h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/20">
                  {/* Image Area */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={audience.image}
                      alt={audience.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B3D2E] via-transparent to-transparent" />
                    
                    {/* Accent Bar */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ backgroundColor: audience.accent }}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="font-serif text-xl font-bold text-white mb-3 group-hover:text-[#4ADE80] transition-colors">
                      {audience.title}
                    </h3>
                    <p className="text-white/60 text-sm leading-relaxed mb-5">
                      {audience.description}
                    </p>
                    <div 
                      className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                      style={{ color: audience.accent }}
                    >
                      <span>{audience.cta}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Section - "Not sure where to start?" */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-block bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12">
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-white mb-3">
              Not sure where to start?
            </h3>
            <p className="text-white/60 mb-6 max-w-lg mx-auto">
              Tell us your goals – gut health, farming or research – and we'll guide you to the right products.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-8 py-6 rounded-full font-semibold"
                onClick={() => {
                  const widget = document.querySelector('[data-ai-assistant]');
                  if (widget) widget.dispatchEvent(new CustomEvent('open'));
                }}
              >
                Ask the Gut Health Assistant
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 rounded-full font-semibold"
                asChild
              >
                <a 
                  href="https://wa.me/27834474639?text=Hi! I need help choosing the right products for my gut health journey."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp Our Team
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
