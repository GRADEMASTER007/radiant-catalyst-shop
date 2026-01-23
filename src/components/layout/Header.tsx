import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, Package, Heart, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { DonationModal } from '@/components/donations/DonationModal';

export function Header() {
  const { itemCount, setIsOpen } = useCart();
  const { user, isAdmin, signOut } = useAuth();
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

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors">Home</Link>
            <Link to="/products" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors">Shop</Link>
            <Link to="/blog" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors">Blog</Link>
            <Link to="/directory" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors">Directory</Link>
            <Link to="/consultations" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors">Consult</Link>
            <Link to="/about" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors">About</Link>
            <Link to="/contact" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <DonationModal 
              trigger={
                <Button variant="ghost" size="sm" className="hidden md:flex gap-1 text-pink-500 hover:text-pink-600 hover:bg-pink-500/10">
                  <Heart className="h-4 w-4 fill-current" />
                  Donate
                </Button>
              }
            />
            
            <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
              <Link to="/my-orders" title="My Orders">
                <Package className="h-5 w-5" />
              </Link>
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

            {/* Auth buttons */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                {isAdmin && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin">Admin</Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-1">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}

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
              <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2">Blog</Link>
              <Link to="/directory" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2">Directory</Link>
              <Link to="/my-orders" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2">My Orders</Link>
              <Link to="/consultations" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2">Consultations</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2">About</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2">Contact</Link>
              
              {/* Mobile Auth */}
              <div className="border-t pt-4 mt-2">
                {user ? (
                  <>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2 block text-primary">
                        Admin Dashboard
                      </Link>
                    )}
                    <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="font-medium py-2 text-destructive">
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
