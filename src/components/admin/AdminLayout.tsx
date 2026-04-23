import { useState } from 'react';
import { useLocation, Link, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Settings,
  Sparkles,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ImageIcon,
  Globe,
  Brain,
  BookOpen,
  Shield,
  Webhook,
  Bot,
  Key,
  MessageSquare,
  Inbox,
  Cpu,
  Truck,
  FileText,
  PenTool,
  Navigation,
  Building2,
  Tag,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { SitemapStaleAlert } from '@/components/admin/SitemapStaleAlert';

// Navigation organized by functional areas
const navItems = [
  // Core Commerce
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Products', url: '/admin/products', icon: Package },
  { title: 'Categories', url: '/admin/categories', icon: FolderTree },
  { title: 'Orders', url: '/admin/orders', icon: ShoppingCart },
  { title: 'Customers', url: '/admin/customers', icon: Users },
  { title: 'Shipping Rates', url: '/admin/shipping-rates', icon: Truck },
  { title: 'Promo Codes', url: '/admin/coupons', icon: Tag },
  { title: 'Quotations', url: '/admin/quotations', icon: FileText },
  
  // Content & Marketing
  { title: 'Blog Posts', url: '/admin/blog-posts', icon: PenTool },
  { title: 'Pages', url: '/admin/pages', icon: FileText },
  { title: 'Menus', url: '/admin/menus', icon: Navigation },
  { title: 'Catalogue', url: '/admin/catalogue', icon: BookOpen },
  { title: 'SEO Manager', url: '/admin/seo', icon: Globe },
  { title: 'Sitemap Audit', url: '/admin/sitemap-audit', icon: Globe },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  
  // Directory
  { title: 'Business Listings', url: '/admin/business-listings', icon: Building2 },
  
  // AI Layer 2 - Central Configuration
  { title: 'AI Configuration', url: '/admin/ai-config', icon: Cpu },
  { title: 'AI Health', url: '/admin/ai-health', icon: Activity },
  
  // AI Feature Pages (Layer 3)
  { title: 'AI Agents', url: '/admin/ai-agents', icon: Bot },
  { title: 'AI Assistant', url: '/admin/ai', icon: Sparkles },
  { title: 'AI Control', url: '/admin/ai-control', icon: Bot },
  { title: 'AI Images', url: '/admin/ai-images', icon: ImageIcon },
  { title: 'Code Audit', url: '/admin/code-audit', icon: Shield },
  
  // API Layer 1 - Credential Storage
  { title: 'API Vault', url: '/admin/api-vault', icon: Key },
  
  // Communication
  { title: 'WhatsApp', url: '/admin/whatsapp', icon: MessageSquare },
  { title: 'Social Inbox', url: '/admin/social-inbox', icon: Inbox },
  { title: 'Chat Settings', url: '/admin/chat-settings', icon: MessageSquare },
  { title: 'Knowledge Base', url: '/admin/knowledge-base', icon: Brain },
  
  // System
  { title: 'Webhooks', url: '/admin/webhooks', icon: Webhook },
  { title: 'Settings', url: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, isAdmin, isLoading, signOut, profile } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have admin privileges.</p>
          <Button onClick={() => window.location.href = '/'}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative z-50 h-screen bg-card border-r transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            {!collapsed && (
              <Link to="/admin" className="font-display text-xl font-bold text-gradient">
                Admin
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex"
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.url || 
                (item.url !== '/admin' && location.pathname.startsWith(item.url));
              
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium">{item.title}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-3 border-t">
            <div className={cn(
              "flex items-center gap-3 px-3 py-2",
              collapsed && "justify-center"
            )}>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {profile?.full_name || 'Admin'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              onClick={signOut}
              className={cn("w-full mt-2", !collapsed && "justify-start")}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="h-16 flex items-center gap-4 px-4 border-b bg-card lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-display text-xl font-bold text-gradient">Admin</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
