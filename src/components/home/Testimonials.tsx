import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Ndlovu',
    role: 'Health-Conscious Mom',
    location: 'Johannesburg, South Africa',
    avatar: '',
    rating: 5,
    text: 'My bloating has improved so much after switching to daily kefir and wheatgrass juice. The starter kit made it so easy to begin!',
    badge: 'Household',
  },
  {
    id: 2,
    name: 'Dr. Thabo Molefe',
    role: 'General Practitioner',
    location: 'Cape Town, South Africa',
    avatar: '',
    rating: 5,
    text: 'I share this site with patients who want to start gentle fermentation at home. Science-aware, no pseudoscience – exactly what we need.',
    badge: 'Practitioner',
  },
  {
    id: 3,
    name: 'Johan van der Berg',
    role: 'Organic Farmer',
    location: 'Stellenbosch, South Africa',
    avatar: '',
    rating: 5,
    text: 'Our soil and leaf health improved dramatically after using BioSoil EM1. Crop yields are up 30% and we\'ve reduced chemical inputs.',
    badge: 'Farmer',
  },
  {
    id: 4,
    name: 'Amahle Dlamini',
    role: 'Nutritionist',
    location: 'Durban, South Africa',
    avatar: '',
    rating: 5,
    text: 'Finally found a supplier with proper probiotic cultures. My clients love the milk kefir grains – they\'re so vibrant and healthy!',
    badge: 'Practitioner',
  },
  {
    id: 5,
    name: 'Peter Okonkwo',
    role: 'Aquaculture Researcher',
    location: 'Lagos, Nigeria',
    avatar: '',
    rating: 5,
    text: 'The live spirulina cultures arrived in perfect condition. We\'re using them for our university biofuel research project.',
    badge: 'Research',
  },
  {
    id: 6,
    name: 'Lindiwe Sithole',
    role: 'Home Fermenter',
    location: 'Pretoria, South Africa',
    avatar: '',
    rating: 5,
    text: 'Started with one kombucha SCOBY, now I have a full fermentation station! The recipes and guides are incredibly helpful.',
    badge: 'DIY',
  },
];

const badgeColors: Record<string, string> = {
  'Household': 'bg-[#22C55E]',
  'Practitioner': 'bg-[#3B82F6]',
  'Farmer': 'bg-[#D97706]',
  'Research': 'bg-[#06B6D4]',
  'DIY': 'bg-[#8B5CF6]',
};

export function Testimonials() {
  return (
    <section className="py-24 bg-gradient-to-b from-[#FFF7EC]/30 to-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span 
            className="inline-block text-[#22C55E] font-semibold tracking-[0.2em] uppercase text-sm mb-3"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Customer Stories
          </motion.span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-5">
            What Our <span className="text-[#22C55E]">Customers Say</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Trusted by households, practitioners and farmers across Africa for quality probiotic cultures and bio-fertilizers.
          </p>
        </motion.div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-white dark:bg-card border border-border/50 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:border-[#22C55E]/30 transition-all duration-500 hover:-translate-y-2 relative">
                {/* Badge */}
                <div className="absolute -top-3 right-6">
                  <span className={`inline-block px-3 py-1 ${badgeColors[testimonial.badge]} text-white text-xs font-semibold rounded-full`}>
                    {testimonial.badge}
                  </span>
                </div>

                {/* Quote Icon */}
                <Quote className="h-10 w-10 text-[#22C55E]/20 mb-4" />
                
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                  ))}
                </div>
                
                {/* Quote Text */}
                <p className="text-foreground/80 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-border/50">
                  <Avatar className="h-12 w-12 border-2 border-[#22C55E]/20">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback className="bg-[#22C55E]/10 text-[#22C55E] font-semibold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-xs text-[#22C55E]">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-20 bg-gradient-to-r from-[#0B3D2E] to-[#0F4C3A] rounded-3xl p-10 md:p-14"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '5,000+', label: 'Happy Customers' },
              { value: '12+', label: 'African Countries' },
              { value: '15+', label: 'Years Experience' },
              { value: '99%', label: 'Satisfaction Rate' },
            ].map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <p className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </p>
                <p className="text-white/60 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-muted-foreground mt-8 max-w-2xl mx-auto"
        >
          * Individual results may vary. These testimonials reflect personal experiences. 
          For specific health concerns, always consult your healthcare provider.
        </motion.p>
      </div>
    </section>
  );
}
