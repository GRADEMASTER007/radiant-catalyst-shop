import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { trackEvent } from './analytics';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
  includeRooting?: boolean;
}

// Rooting service pricing tiers
export function calculateRootingPrice(totalPlants: number): number {
  if (totalPlants >= 600) return 2.50;
  if (totalPlants >= 150) return 5;
  return 30;
}

export function calculateTotalRootingCost(items: CartItem[]): number {
  const itemsWithRooting = items.filter(item => item.includeRooting);
  if (itemsWithRooting.length === 0) return 0;
  
  const totalPlantsWithRooting = itemsWithRooting.reduce((sum, item) => sum + item.quantity, 0);
  const pricePerPlant = calculateRootingPrice(totalPlantsWithRooting);
  return totalPlantsWithRooting * pricePerPlant;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: { id: string; name: string; price: number; image: string; sku: string }, includeRooting?: boolean) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleRooting: (productId: string, includeRooting: boolean) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  rootingCost: number;
  totalWithRooting: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: { id: string; name: string; price: number; image: string; sku: string }, includeRooting = false) => {
    setItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, includeRooting: includeRooting || item.includeRooting }
            : item
        );
      }
      return [...prev, {
        id: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        sku: product.sku,
        includeRooting,
      }];
    });
    setIsOpen(true);
    trackEvent('add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      price: product.price,
      include_rooting: includeRooting,
      currency: 'ZAR',
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const toggleRooting = (productId: string, includeRooting: boolean) => {
    setItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, includeRooting } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const rootingCost = calculateTotalRootingCost(items);
  const totalWithRooting = subtotal + rootingCost;

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      toggleRooting,
      clearCart,
      itemCount,
      subtotal,
      rootingCost,
      totalWithRooting,
      isOpen,
      setIsOpen,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
