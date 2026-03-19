import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, Package, Heart, User, LogOut, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useCategories } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { DonationModal } from '@/components/donations/DonationModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const learnCategories = [
  { label: 'Gut Health & Microbiome', href: '/learn/gut-health-guide' },
  { label: 'Fermentation Starter Guide', href: '/learn/fermentation-guide' },
  { label: 'Farming with EM1', href: '/learn/farming-em1-guide' },
  { label: 'Algae & Spirulina 101', href: '/learn/algae-guide' },
  { label: 'For Practitioners', href: '/learn/for-practitioners' },
];

const hubCategories = [
  { label: 'Kefir Grains', href: '/kefir-grains' },
  { label: 'Kombucha SCOBY', href: '/kombucha' },
  { label: 'Sourdough Starter', href: '/sourdough-starter' },
  { label: 'Vinegar Mother', href: '/vinegar-starter-culture' },
  { label: 'Natural Probiotics', href: '/natural-probiotics' },
  { label: 'Sauerkraut Guide', href: '/sauerkraut' },
  { label: 'Natural Brown Sugar', href: '/natural-sugar' },
  { label: 'Diatomaceous Earth', href: '/diatomaceous-earth' },
];

export function Header() {
  const { itemCount, setIsOpen } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const { data: categories } = useCategories();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const shopCategories = useMemo(() => {
    const cats = (categories || []).map((c) => ({
      label: c.name,
      href: `/products?category=${c.slug}`,
    }));
    cats.push({ label: 'View All Products', href: '/products' });
    return cats;
  }, [categories]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card-strong border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-xl md:text-2xl font-display font-bold text-gradient-probiotic">
              Gut Health
            </span>
            <span className="hidden sm:inline text-xs text-muted-foreground border-l border-border pl-3">
              Probiotics<br />South Africa
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-4">
            <Link to="/" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors px-2">Home</Link>
            
            {/* Shop Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors px-2 flex items-center gap-1">
                Shop <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {shopCategories.map((cat) => (
                  <DropdownMenuItem key={cat.href} asChild>
                    <Link to={cat.href}>{cat.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Learn Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors px-2 flex items-center gap-1">
                Learn <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-[70vh] overflow-y-auto">
                {learnCategories.map((cat) => (
                  <DropdownMenuItem key={cat.href} asChild>
                    <Link to={cat.href}>{cat.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Product Guides</span>
                {hubCategories.map((cat) => (
                  <DropdownMenuItem key={cat.href} asChild>
                    <Link to={cat.href}>{cat.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/learn/for-practitioners" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors px-2">For Practitioners</Link>
            <Link to="/blog" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors px-2">Blog</Link>
            <Link to="/about" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors px-2">About</Link>
            <Link to="/contact" className="animated-underline font-medium text-foreground/80 hover:text-foreground transition-colors px-2">Contact</Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <DonationModal 
              trigger={
                <Button variant="ghost" size="sm" className="hidden md:flex gap-1 text-gut-green hover:text-gut-forest hover:bg-gut-green/10">
                  <Heart className="h-4 w-4 fill-current" />
                  Support
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
              className="lg:hidden"
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
            className="lg:hidden glass-card-strong border-t max-h-[80vh] overflow-y-auto"
          >
            <nav className="flex flex-col p-4 gap-2">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2">Home</Link>
              
              {/* Mobile Shop Section */}
              <div className="border-t pt-2 mt-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Shop</span>
                {shopCategories.map((cat) => (
                  <Link key={cat.href} to={cat.href} onClick={() => setMobileMenuOpen(false)} className="font-medium py-2 block pl-3">
                    {cat.label}
                  </Link>
                ))}
              </div>

              {/* Mobile Learn Section */}
              <div className="border-t pt-2 mt-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Learn</span>
                {learnCategories.map((cat) => (
                  <Link key={cat.href} to={cat.href} onClick={() => setMobileMenuOpen(false)} className="font-medium py-2 block pl-3">
                    {cat.label}
                  </Link>
                ))}
              </div>

              <div className="border-t pt-2 mt-2">
                <Link to="/learn/for-practitioners" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2 block">For Practitioners</Link>
                <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2 block">Blog</Link>
                <Link to="/my-orders" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2 block">My Orders</Link>
                <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2 block">About</Link>
                <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2 block">Contact</Link>
              </div>
              
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
