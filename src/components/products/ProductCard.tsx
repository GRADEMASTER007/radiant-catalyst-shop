import { Link } from 'react-router-dom';
import { Product } from '@/types/product';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

// Fallback product images based on product name/type
import kefirGrainsImg from '@/assets/product-kefir-grains.jpg';
import kombuchaScobyImg from '@/assets/product-kombucha-scoby.jpg';
import em1BottleImg from '@/assets/product-em1-bottle.jpg';
import spirulinaCulturesImg from '@/assets/product-spirulina-cultures.jpg';
import blackDragonImg from '@/assets/product-black-dragon.jpg';
import rubyRedDragonImg from '@/assets/product-ruby-red-dragon.jpg';
import yellowAmarilloImg from '@/assets/product-yellow-amarillo.jpg';
import dragonFruitCutImg from '@/assets/dragon-fruit-cut.png';

// Function to get fallback image based on product name
const getFallbackImage = (productName: string): string => {
  const lowerName = productName.toLowerCase();
  
  // Dragon fruit varieties - check first for specific matches
  if (lowerName.includes('black dragon')) {
    return blackDragonImg;
  }
  if (lowerName.includes('ruby red')) {
    return rubyRedDragonImg;
  }
  if (lowerName.includes('amarillo') || (lowerName.includes('yellow') && lowerName.includes('dragon'))) {
    return yellowAmarilloImg;
  }
  if (lowerName.includes('dragon fruit') || lowerName.includes('pitaya')) {
    return dragonFruitCutImg;
  }
  
  // Other product types
  if (lowerName.includes('kefir') || lowerName.includes('yogurt') || lowerName.includes('buttermilk')) {
    return kefirGrainsImg;
  }
  if (lowerName.includes('kombucha') || lowerName.includes('scoby') || lowerName.includes('jun')) {
    return kombuchaScobyImg;
  }
  if (lowerName.includes('em1') || lowerName.includes('em-1') || lowerName.includes('biofertilizer') || lowerName.includes('fertilizer') || lowerName.includes('seed') || lowerName.includes('wheatgrass')) {
    return em1BottleImg;
  }
  if (lowerName.includes('spirulina') || lowerName.includes('chlorella') || lowerName.includes('algae')) {
    return spirulinaCulturesImg;
  }
  if (lowerName.includes('vinegar') || lowerName.includes('tempeh') || lowerName.includes('natto') || lowerName.includes('miso') || lowerName.includes('ferment')) {
    return kefirGrainsImg;
  }
  if (lowerName.includes('ginger') || lowerName.includes('bug')) {
    return kombuchaScobyImg;
  }
  
  // Default fallback
  return kefirGrainsImg;
};

interface ProductCardProps {
  product: Product;
  index?: number;
  variant?: 'grid' | 'list';
}

export function ProductCard({ product, index = 0, variant = 'grid' }: ProductCardProps) {
  const { addItem } = useCart();

  // Get the product image with fallback
  const productImage = product.primary_image_url || getFallbackImage(product.name);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(price);
  };

  const hasDiscount = product.compare_at_price_zar && product.compare_at_price_zar > product.price_zar;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price_zar,
      image: productImage,
      sku: product.sku,
    });
  };

  if (variant === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="glass-card p-4 rounded-xl flex gap-4"
      >
        <Link to={`/product/${product.slug}`} className="flex-shrink-0">
          <img
            src={productImage}
            alt={product.name}
            className="w-32 h-32 object-cover rounded-lg"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-display font-semibold text-lg hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.short_description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.short_description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="price-tag">{formatPrice(product.price_zar)}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_at_price_zar!)}
              </span>
            )}
          </div>
        </div>
        <Button className="btn-sunset self-center" onClick={handleAddToCart}>
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="product-card group"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-muted relative">
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
              SALE
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-display font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="price-tag">{formatPrice(product.price_zar)}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_at_price_zar!)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex gap-2 mt-4">
        <Button className="flex-1 btn-sunset" onClick={handleAddToCart}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
        <WhatsAppButton 
          productName={product.name}
          className="px-3"
        >
          <span className="sr-only">WhatsApp</span>
        </WhatsAppButton>
      </div>
    </motion.div>
  );
}
