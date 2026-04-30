import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Contact from "./pages/Contact";
import About from "./pages/About";
import BusinessResources from "./pages/BusinessResources";
import ConsultationServices from "./pages/ConsultationServices";
import RootingServices from "./pages/RootingServices";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import MyOrders from "./pages/MyOrders";
import TrackOrder from "./pages/TrackOrder";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import AdminOrders from "./pages/admin/Orders";
import AdminCustomers from "./pages/admin/Customers";
import AdminGuestCheckouts from "./pages/admin/GuestCheckouts";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminAI from "./pages/admin/AIAssistant";
import AdminAIImages from "./pages/admin/AIImageGenerator";
import AdminCatalogue from "./pages/admin/CatalogueManager";
import AdminSEO from "./pages/admin/SEOManager";
import AdminSitemapAudit from "./pages/admin/SitemapAudit";
import AdminSettings from "./pages/admin/Settings";
import AdminKnowledgeBase from "./pages/admin/KnowledgeBase";
import AdminCodeAudit from "./pages/admin/CodeAudit";
import AdminWebhooks from "./pages/admin/WebhookTester";
import AdminAIControl from "./pages/admin/AIControlPanel";
import AdminAPIVault from "./pages/admin/APIKeyVault";
import AdminWhatsApp from "./pages/admin/WhatsAppInbox";
import AdminSocialInbox from "./pages/admin/SocialInbox";
// AIModelConfig removed - superseded by AIConfiguration
import AdminChatSettings from "./pages/admin/ChatSettings";
import AdminShippingRates from "./pages/admin/ShippingRates";
import AdminAIProviders from "./pages/admin/AIProviderDashboard";
import AdminAIConfiguration from "./pages/admin/AIConfiguration";
import AdminAIDiagnostics from "./pages/admin/AIDiagnostics";
import AdminAIHealth from "./pages/admin/AIHealthDashboard";
import Blog from "./pages/Blog";
import BlogPostDetail from "./pages/BlogPostDetail";
import BusinessDirectory from "./pages/BusinessDirectory";
import BusinessRegister from "./pages/BusinessRegister";
import BusinessDetail from "./pages/BusinessDetail";
import PageDetail from "./pages/PageDetail";
import AdminBlogPosts from "./pages/admin/BlogPosts";
import AdminPages from "./pages/admin/Pages";
import AdminMenus from "./pages/admin/Menus";
import AdminBusinessListings from "./pages/admin/BusinessListings";
import AdminAIAgents from "./pages/admin/AIAgents";
import AdminCoupons from "./pages/admin/Coupons";
import AdminQuotations from "./pages/admin/Quotations";
import GutHealthGuide from "./pages/learn/GutHealthGuide";
import ForPractitioners from "./pages/learn/ForPractitioners";
import FermentationGuide from "./pages/learn/FermentationGuide";
import AlgaeGuide from "./pages/learn/AlgaeGuide";
import FarmingEM1Guide from "./pages/learn/FarmingEM1Guide";
import KefirGrains from "./pages/hub/KefirGrains";
import Kombucha from "./pages/hub/Kombucha";
import SourdoughStarter from "./pages/hub/SourdoughStarter";
import VinegarStarterCulture from "./pages/hub/VinegarStarterCulture";
import NaturalSugar from "./pages/hub/NaturalSugar";
import NaturalProbiotics from "./pages/hub/NaturalProbiotics";
import Sauerkraut from "./pages/hub/Sauerkraut";
import DiatomaceousEarth from "./pages/hub/DiatomaceousEarth";
import AssistantPage from "./pages/hub/Assistant";
import SEOChecklist from "./pages/hub/SEOChecklist";
import SpirulinaFarming from "./pages/hub/SpirulinaFarming";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ClarityPrivacy />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/business-resources" element={<BusinessResources />} />
              <Route path="/consultations" element={<ConsultationServices />} />
              <Route path="/rooting-services" element={<RootingServices />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPostDetail />} />
              <Route path="/directory" element={<BusinessDirectory />} />
              <Route path="/directory/register" element={<BusinessRegister />} />
              <Route path="/directory/:slug" element={<BusinessDetail />} />
              <Route path="/page/:slug" element={<PageDetail />} />
              
              {/* Learn Routes */}
              <Route path="/learn/gut-health-guide" element={<GutHealthGuide />} />
              <Route path="/learn/for-practitioners" element={<ForPractitioners />} />
              <Route path="/learn/fermentation-guide" element={<FermentationGuide />} />
              <Route path="/learn/algae-guide" element={<AlgaeGuide />} />
              <Route path="/learn/farming-em1-guide" element={<FarmingEM1Guide />} />
              
              {/* Content Hub Routes */}
              <Route path="/kefir-grains" element={<KefirGrains />} />
              <Route path="/kombucha" element={<Kombucha />} />
              <Route path="/sourdough-starter" element={<SourdoughStarter />} />
              <Route path="/vinegar-starter-culture" element={<VinegarStarterCulture />} />
              <Route path="/natural-sugar" element={<NaturalSugar />} />
              <Route path="/natural-probiotics" element={<NaturalProbiotics />} />
              <Route path="/sauerkraut" element={<Sauerkraut />} />
              <Route path="/diatomaceous-earth" element={<DiatomaceousEarth />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/seo-checklist" element={<SEOChecklist />} />
              <Route path="/spirulina-farming" element={<SpirulinaFarming />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="guest-checkouts" element={<AdminGuestCheckouts />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="ai" element={<AdminAI />} />
                <Route path="ai-agents" element={<AdminAIAgents />} />
                <Route path="ai-images" element={<AdminAIImages />} />
                <Route path="catalogue" element={<AdminCatalogue />} />
                <Route path="seo" element={<AdminSEO />} />
                <Route path="sitemap-audit" element={<AdminSitemapAudit />} />
                <Route path="knowledge-base" element={<AdminKnowledgeBase />} />
                <Route path="code-audit" element={<AdminCodeAudit />} />
                <Route path="webhooks" element={<AdminWebhooks />} />
                <Route path="ai-control" element={<AdminAIControl />} />
                <Route path="api-vault" element={<AdminAPIVault />} />
                <Route path="whatsapp" element={<AdminWhatsApp />} />
                <Route path="social-inbox" element={<AdminSocialInbox />} />
                {/* ai-models route removed - redirected to ai-config */}
                <Route path="chat-settings" element={<AdminChatSettings />} />
                <Route path="shipping-rates" element={<AdminShippingRates />} />
                <Route path="ai-providers" element={<AdminAIProviders />} />
                <Route path="ai-config" element={<AdminAIConfiguration />} />
                <Route path="ai-diagnostics" element={<AdminAIDiagnostics />} />
                <Route path="ai-health" element={<AdminAIHealth />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="blog-posts" element={<AdminBlogPosts />} />
                <Route path="pages" element={<AdminPages />} />
                <Route path="menus" element={<AdminMenus />} />
                <Route path="business-listings" element={<AdminBusinessListings />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="quotations" element={<AdminQuotations />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingWhatsApp />
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
