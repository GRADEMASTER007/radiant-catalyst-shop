import { motion } from 'framer-motion';
import { useFeaturedProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Star, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const productBadges: Record<string, string> = {
  'water-kefir': 'Best for Beginners',
  'milk-kefir': 'Most Popular',
  'kombucha': 'Customer Favourite',
  'em1': 'Farm Essential',
  'spirulina': 'Lab Ready',
  'wheatgrass': 'Quick Start',
};

export function FeaturedProducts() {
  const { data: products, isLoading } = useFeaturedProducts();

  return (
    <section id="featured-products" className="py-24 bg-gradient-to-b from-background to-[#FFF7EC]/20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div 
            className="inline-flex items-center gap-2 text-[#22C55E] font-semibold tracking-[0.2em] uppercase text-sm mb-3"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Curated Selection</span>
          </motion.div>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-foreground">
            Featured <span className="text-[#22C55E]">Products</span>
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
            Start with our most-loved cultures, kits and EM1 solutions. 
            Handpicked for quality and trusted by thousands across Africa.
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-10 w-full rounded-full" />
              </div>
            ))
          ) : (
            products?.slice(0, 8).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group"
              >
                <div className="relative">
                  {/* Product Badge */}
                  {product.tags?.some(tag => productBadges[tag]) && (
                    <div className="absolute -top-3 left-4 z-10">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#22C55E] text-white text-xs font-semibold rounded-full shadow-lg">
                        <Star className="w-3 h-3 fill-current" />
                        {productBadges[product.tags?.find(tag => productBadges[tag]) || '']}
                      </span>
                    </div>
                  )}
                  <ProductCard product={product} index={index} />
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center mt-12"
        >
          <Link to="/products">
            <Button 
              size="lg"
              variant="outline"
              className="group border-2 border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E] hover:text-white px-10 py-6 rounded-full font-semibold transition-all duration-300"
            >
              <span>View All Products</span>
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
