import { Link } from 'react-router-dom';
import { Product } from '@/types/product';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(price);
  };

  const hasDiscount = product.compare_at_price_zar && product.compare_at_price_zar > product.price_zar;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="product-card group"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-muted relative">
          <img
            src={product.primary_image_url || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-tribal-red text-white text-xs font-bold px-2 py-1 rounded">
              SALE
            </span>
          )}
          {product.stock_quantity < 5 && product.stock_quantity > 0 && (
            <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded">
              Low Stock
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          {product.brand && (
            <span className="text-xs text-muted-foreground uppercase tracking-wide">{product.brand}</span>
          )}
          <h3 className="font-display font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.short_description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{product.short_description}</p>
          )}
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

      <Button
        className="w-full mt-4 btn-sunset"
        onClick={(e) => {
          e.preventDefault();
          addItem({
            id: product.id,
            name: product.name,
            price: product.price_zar,
            image: product.primary_image_url || '/placeholder.svg',
            sku: product.sku,
          });
        }}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Add to Cart
      </Button>
    </motion.div>
  );
}
