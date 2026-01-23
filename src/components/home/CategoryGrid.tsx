import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Milk, 
  FlaskConical, 
  Sprout, 
  Wrench, 
  BookOpen, 
  Heart, 
  BookMarked,
  ShoppingBag,
  Star,
  GraduationCap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const categories = [
  {
    icon: Milk,
    emoji: '🥛',
    title: 'Fermented Foods & Cultures',
    description: 'Nurture your gut with live kefir, kombucha, yogurt and more',
    href: '/products?category=fermented-foods',
    color: 'from-gut-green to-gut-lime',
  },
  {
    icon: FlaskConical,
    emoji: '🧪',
    title: 'Algae & Superfoods',
    description: 'Grow and use live spirulina and chlorella',
    href: '/products?category=algae-superfoods',
    color: 'from-gut-teal to-gut-blue',
  },
  {
    icon: Sprout,
    emoji: '🌵',
    title: 'Farming & Growing',
    description: 'From wheatgrass to EM1 for soil and water',
    href: '/products?category=farming-em1',
    color: 'from-gut-forest to-gut-green',
  },
  {
    icon: Wrench,
    emoji: '🧰',
    title: 'DIY Health Kits',
    description: 'Everything you need to start fermenting at home',
    href: '/products?category=diy-kits',
    color: 'from-gut-brown to-gut-gold',
  },
  {
    icon: BookOpen,
    emoji: '🍽️',
    title: 'Recipes & How-To Guides',
    description: 'Make gut-friendly meals and drinks',
    href: '/page/recipes-guides',
    color: 'from-gut-gold to-amber-500',
  },
  {
    icon: Heart,
    emoji: '💚',
    title: 'Health & Wellness',
    description: 'Learn about probiotics, detox and immunity',
    href: '/page/gut-health-guide',
    color: 'from-rose-400 to-gut-green',
  },
  {
    icon: BookMarked,
    emoji: '📚',
    title: 'eBooks & Recipe Books',
    description: 'Download guides and plans',
    href: '/products?category=ebooks',
    color: 'from-purple-500 to-gut-teal',
  },
  {
    icon: ShoppingBag,
    emoji: '🛒',
    title: 'Shop by Product',
    description: 'Browse everything in one place',
    href: '/products',
    color: 'from-gut-green to-gut-teal',
  },
  {
    icon: Star,
    emoji: '🌟',
    title: 'Customer Stories',
    description: 'Reviews and success stories',
    href: '/page/testimonials',
    color: 'from-gut-gold to-orange-500',
  },
  {
    icon: GraduationCap,
    emoji: '🧠',
    title: 'Educational Resources',
    description: 'Science-backed information for practitioners',
    href: '/page/for-practitioners',
    color: 'from-gut-blue to-gut-forest',
  },
];

export function CategoryGrid() {
  return (
    <section className="section-container bg-gradient-to-b from-background to-gut-cream/30">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <p className="text-primary font-medium tracking-widest uppercase mb-2">Explore Our Range</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
          What We <span className="text-gradient-probiotic">Offer</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          From live probiotic cultures to bio-fertilizers, we provide everything you need for natural health and sustainable farming.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((category, index) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <Link to={category.href}>
              <Card className="h-full group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <span className="text-2xl">{category.emoji}</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
