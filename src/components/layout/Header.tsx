import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { itemCount, setIsOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card-strong border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-xl md:text-2xl font-display font-bold text-gradient-dragon">
              DFSA
            </span>
            <span className="hidden sm:inline text-xs text-muted-foreground border-l border-border pl-3">
              Dragon Fruit<br />Farming Africa
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors">Home</Link>
            <Link to="/products" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors">Shop</Link>
            <Link to="/consultations" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors">Consultations</Link>
            <Link to="/rooting-services" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors">Rooting</Link>
            <Link to="/about" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors">About</Link>
            <Link to="/contact" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setIsOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-card-strong border-t"
          >
            <nav className="flex flex-col p-4 gap-4">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2">Home</Link>
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2">Shop</Link>
              <Link to="/consultations" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2">Consultations</Link>
              <Link to="/rooting-services" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2">Rooting</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2">About</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2">Contact</Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
