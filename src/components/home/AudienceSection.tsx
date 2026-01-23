import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Baby, 
  Stethoscope, 
  Tractor, 
  FlaskConical, 
  Home 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const audiences = [
  {
    icon: Heart,
    title: 'Everyday Gut Health',
    description: 'For bloating, IBS, sluggish digestion or general probiotic balance. Start with kefir, kombucha, or yogurt cultures.',
    cta: 'Shop Starter Kits',
    href: '/products?category=fermented-foods',
    color: 'bg-gut-green',
  },
  {
    icon: Baby,
    title: 'Pregnancy & Postpartum',
    description: 'Safe, gentle probiotics for expecting and nursing mothers. Always consult your healthcare provider.',
    cta: 'Gentle Cultures',
    href: '/products?tag=pregnancy-safe',
    color: 'bg-rose-500',
  },
  {
    icon: Stethoscope,
    title: 'Practitioners & Clinics',
    description: 'Science-backed information for doctors, dietitians and health coaches to share with patients.',
    cta: 'For Practitioners',
    href: '/page/for-practitioners',
    color: 'bg-gut-blue',
  },
  {
    icon: Tractor,
    title: 'Farmers & Growers',
    description: 'EM1, biofertilizers, pond treatments and soil solutions for organic and regenerative agriculture.',
    cta: 'Shop EM1 Range',
    href: '/products?category=bio-fertilizers',
    color: 'bg-gut-brown',
  },
  {
    icon: FlaskConical,
    title: 'Algae Enthusiasts',
    description: 'Live spirulina and chlorella for labs, aquaculture, biofuel research and supplement production.',
    cta: 'Algae Cultures',
    href: '/products?category=algae-superfoods',
    color: 'bg-gut-teal',
  },
  {
    icon: Home,
    title: 'Homesteaders & DIY',
    description: 'Sourdough starters, wheatgrass kits, diatomaceous earth and everything for self-sufficient living.',
    cta: 'DIY Kits',
    href: '/products?category=diy-kits',
    color: 'bg-gut-gold',
  },
];

export function AudienceSection() {
  return (
    <section className="section-container">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <p className="text-primary font-medium tracking-widest uppercase mb-2">Who We Serve</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Solutions for <span className="text-gradient-probiotic">Every Need</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Whether you're a health-conscious home user, a medical professional, or a commercial farmer, 
          we have the products and expertise to support your journey.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {audiences.map((audience, index) => (
          <motion.div
            key={audience.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="h-full group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className={`w-14 h-14 rounded-2xl ${audience.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <audience.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">{audience.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{audience.description}</p>
                <Link to={audience.href}>
                  <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-white transition-colors">
                    {audience.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
