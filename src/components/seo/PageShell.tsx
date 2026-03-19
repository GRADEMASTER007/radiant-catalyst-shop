import { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

export function PageShell({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartSidebar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {children}
      </main>
      <footer className="bg-[#0B3D2E] text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="font-serif text-xl font-bold mb-2"><span className="text-[#4ADE80]">Purely Health</span> Nutra</p>
          <p className="text-white/60 text-sm mb-4">Gauteng, South Africa · Nationwide & Worldwide Shipping</p>
          <p className="text-white/40 text-xs">© {new Date().getFullYear()} Purely Health Nutra. All rights reserved.</p>
          {isAdmin && (
            <Link to="/admin" className="text-[#4ADE80] text-xs mt-2 inline-block">Admin</Link>
          )}
        </div>
      </footer>
    </div>
  );
}
