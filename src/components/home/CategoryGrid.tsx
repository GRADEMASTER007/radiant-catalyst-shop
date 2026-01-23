import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const categories = [
  {
    title: 'Fermented Foods & Cultures',
    description: 'Nurture your gut with live kefir, kombucha, yogurt and more.',
    href: '/products?category=fermented-foods',
    imagePlaceholder: 'Glass jars of kefir, kombucha, yogurt on a wooden African kitchen table with natural light streaming in',
    gradient: 'from-[#0B3D2E]/80 to-[#22C55E]/60',
  },
  {
    title: 'Algae & Superfoods',
    description: 'Grow and use live spirulina and chlorella cultures.',
    href: '/products?category=algae-superfoods',
    imagePlaceholder: 'Close-up of spirulina or chlorella culture jar glowing green, person pouring a green algae shot',
    gradient: 'from-[#0369A1]/80 to-[#22D3EE]/60',
  },
  {
    title: 'Farming & Growing',
    description: 'From wheatgrass seeds to EM1 for soil and water.',
    href: '/products?category=farming-em1',
    imagePlaceholder: 'African farmer or gardener tending a bed, watering wheatgrass trays or crops at sunrise',
    gradient: 'from-[#78350F]/80 to-[#D97706]/60',
  },
  {
    title: 'DIY Health Kits',
    description: 'Everything you need to start fermenting at home.',
    href: '/products?category=diy-kits',
    imagePlaceholder: 'Hands preparing jars, strainers, nut milk bags and cultures on a clean countertop',
    gradient: 'from-[#4C1D95]/80 to-[#8B5CF6]/60',
  },
  {
    title: 'Recipes & How-To Guides',
    description: 'Make gut-friendly meals and drinks with our guides.',
    href: '/learn/fermentation-guide',
    imagePlaceholder: 'Smoothie bowl, sourdough toast, ferment jars styled beautifully on a rustic table',
    gradient: 'from-[#BE185D]/80 to-[#F472B6]/60',
  },
  {
    title: 'Health & Wellness',
    description: 'Gentle guidance on gut health, detox and immunity.',
    href: '/learn/gut-health-guide',
    imagePlaceholder: 'Person holding their stomach with a soft smile, or a couple walking outside in nature',
    gradient: 'from-[#059669]/80 to-[#6EE7B7]/60',
  },
  {
    title: 'Seeds & Growing',
    description: 'Wheatgrass seeds, soya beans and organic growing supplies.',
    href: '/products?category=seeds-growing',
    imagePlaceholder: 'Wheatgrass trays, soya beans and seeds on a garden table with sunlight',
    gradient: 'from-[#7C3AED]/80 to-[#C4B5FD]/60',
  },
  {
    title: 'For Practitioners',
    description: 'Science-backed info for doctors, clinics and serious learners.',
    href: '/learn/for-practitioners',
    imagePlaceholder: 'Doctor or nutritionist consulting a patient, or lab-style notebook with microscope',
    gradient: 'from-[#1E40AF]/80 to-[#60A5FA]/60',
  },
];

export function CategoryGrid() {
  return (
    <section className="py-24 bg-gradient-to-b from-background via-[#FFF7EC]/30 to-background">
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
            Explore Our Range
          </motion.span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-foreground">
            What We <span className="text-[#22C55E]">Offer</span>
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
            From live probiotic cultures to bio-fertilizers, we connect African homes, 
            clinics and farms with nature-powered gut health solutions.
          </p>
        </motion.div>

        {/* Premium Photo-Backed Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <Link to={category.href} className="block group">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                  {/* Background Image Placeholder */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ 
                      backgroundImage: `url('/placeholder.svg')`,
                      /* 
                        IMAGE PLACEHOLDER: ${category.imagePlaceholder}
                        Upload real lifestyle photo matching this description
                      */
                    }}
                  >
                    {/* Fallback gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient}`} />
                  </div>
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <h3 className="font-serif text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-[#4ADE80] transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed mb-4">
                      {category.description}
                    </p>
                    <div className="flex items-center gap-2 text-[#22C55E] font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>Explore</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Hover Border Effect */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#22C55E]/50 transition-colors duration-300" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
