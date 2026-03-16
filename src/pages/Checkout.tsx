import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/hooks/use-currency";
import { useAuth } from "@/lib/auth-context";
import { useCheckoutPersistence } from "@/hooks/use-checkout-persistence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Truck, CreditCard, MapPin, Loader2, Check, Package, RefreshCw, Tag, X } from "lucide-react";
import { getShippingRates, getPudoLockers, createOrder, initiatePayFastPayment, initiateYocoPayment, sendOrderConfirmationEmail, ShippingRate, PudoLocker, PayFastPaymentResult } from "@/lib/api";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ExportCertifications, ExportCertificationOptions, calculateCertificationTotal } from "@/components/checkout/ExportCertifications";
import { PayFastPreflight } from "@/components/checkout/PayFastPreflight";

type CheckoutStep = "shipping" | "delivery" | "payment";

interface ShippingFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

// Retry configuration for shipping rates
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, rootingCost, totalWithRooting, clearCart } = useCart();
  const { formatPrice, currency } = useCurrency();
  const { user } = useAuth();
  const { loadSavedState, saveState, clearSavedState, defaultShippingData, defaultCertifications } = useCheckoutPersistence();
  
  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [loading, setLoading] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  
  // Shipping form - initialize with defaults, restore from storage in useEffect
  const [shippingData, setShippingData] = useState<ShippingFormData>(defaultShippingData);
  
  // Shipping options
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingRate | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  
  // Retry state for shipping rates
  const [retryCount, setRetryCount] = useState(0);
  const [retryError, setRetryError] = useState<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // PUDO lockers
  const [pudoLockers, setPudoLockers] = useState<PudoLocker[]>([]);
  const [selectedLocker, setSelectedLocker] = useState<PudoLocker | null>(null);
  
  // Payment - PayFast temporarily deactivated, using Yoco only
  const [paymentMethod, setPaymentMethod] = useState<"payfast" | "yoco">("yoco");

  // Promo code
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  
  // Prevent duplicate submissions
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Export certifications
  const [certifications, setCertifications] = useState<ExportCertificationOptions>(defaultCertifications);
  
  // Product dimensions for shipping
  const [productDimensions, setProductDimensions] = useState<{
    totalWeight: number;
    maxLength: number;
    maxWidth: number;
    maxHeight: number;
  }>({ totalWeight: 0, maxLength: 30, maxWidth: 20, maxHeight: 15 });
  
  const shippingCost = selectedShipping?.price || 0;
  const certificationCost = calculateCertificationTotal(certifications);
  const total = totalWithRooting + shippingCost + certificationCost - promoDiscount;

  // Apply promo code
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), orderSubtotal: subtotal }),
      });
      const data = await response.json();
      if (data.valid) {
        setPromoDiscount(data.discount);
        setAppliedPromo(data.code);
        toast.success(`Coupon applied! You save ${data.discountType === 'percentage' ? `${data.discountValue}%` : `R${data.discount.toFixed(2)}`}`);
      } else {
        setPromoError(data.error || "Invalid coupon code");
      }
    } catch {
      setPromoError("Failed to validate coupon");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoDiscount(0);
    setAppliedPromo(null);
    setPromoError(null);
  };

  // Restore checkout state from localStorage on mount
  useEffect(() => {
    const savedState = loadSavedState();
    if (savedState && !isRestored) {
      if (savedState.shippingData) {
        setShippingData(savedState.shippingData);
      }
      if (savedState.step) {
        // Don't restore to payment step for security
        setStep(savedState.step === 'payment' ? 'delivery' : savedState.step);
      }
      if (savedState.certifications) {
        setCertifications(savedState.certifications);
      }
      setIsRestored(true);
      toast.success("Restored your checkout progress", { duration: 3000 });
    }
  }, [loadSavedState, isRestored]);

  // Save checkout state whenever form data changes
  useEffect(() => {
    if (isRestored || shippingData.email || shippingData.name) {
      saveState({
        shippingData,
        step,
        selectedShippingService: selectedShipping?.service,
        certifications,
      });
    }
  }, [shippingData, step, selectedShipping?.service, certifications, saveState, isRestored]);

  // Fetch product dimensions from database
  useEffect(() => {
    const fetchProductDimensions = async () => {
      if (items.length === 0) return;
      
      const productIds = items.map(item => item.productId);
      const { data: products } = await supabase
        .from('products')
        .select('id, weight_kg, length_cm, width_cm, height_cm')
        .in('id', productIds);
      
      if (products) {
        let totalWeight = 0;
        let maxLength = 30;
        let maxWidth = 20;
        let maxHeight = 15;
        
        products.forEach(product => {
          const cartItem = items.find(i => i.productId === product.id);
          const quantity = cartItem?.quantity || 1;
          
          // Sum weights (use 0.5kg default if not set)
          totalWeight += (product.weight_kg || 0.5) * quantity;
          
          // Get max dimensions for shipping calculation
          if (product.length_cm && product.length_cm > maxLength) maxLength = product.length_cm;
          if (product.width_cm && product.width_cm > maxWidth) maxWidth = product.width_cm;
          if (product.height_cm && product.height_cm > maxHeight) maxHeight = product.height_cm;
        });
        
        setProductDimensions({ totalWeight, maxLength, maxWidth, maxHeight });
      }
    };
    
    fetchProductDimensions();
  }, [items]);

  // Fetch shipping rates when postal code or dimensions change
  useEffect(() => {
    if (shippingData.postalCode.length >= 4 && productDimensions.totalWeight > 0) {
      fetchShippingRatesWithRetry();
    }
    
    // Cleanup retry timeout on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [shippingData.postalCode, productDimensions]);

  // Calculate delay with exponential backoff and jitter
  const calculateRetryDelay = useCallback((attempt: number): number => {
    const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelayMs);
  }, []);

  const fetchShippingRatesWithRetry = async (attempt = 0) => {
    // Cancel any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setLoadingRates(true);
    setRetryError(null);
    setRetryCount(attempt);

    try {
      const [rates, lockers] = await Promise.all([
        getShippingRates(
          "0001", 
          shippingData.postalCode, 
          productDimensions.totalWeight,
          {
            length: productDimensions.maxLength,
            width: productDimensions.maxWidth,
            height: productDimensions.maxHeight,
          }
        ),
        getPudoLockers(shippingData.postalCode),
      ]);

      // Success - clear retry state
      setShippingRates(rates);
      setPudoLockers(lockers);
      setRetryCount(0);
      setRetryError(null);
      
      // If we have saved shipping selection, try to restore it
      const savedState = loadSavedState();
      if (savedState?.selectedShippingService && rates.length > 0) {
        const savedRate = rates.find(r => r.service === savedState.selectedShippingService);
        if (savedRate) {
          setSelectedShipping(savedRate);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch shipping rates (attempt ${attempt + 1}):`, error);
      
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = calculateRetryDelay(attempt);
        setRetryError(`Retrying in ${Math.round(delay / 1000)}s...`);
        setRetryCount(attempt + 1);
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchShippingRatesWithRetry(attempt + 1);
        }, delay);
      } else {
        setRetryError("Failed to load shipping rates. Please try again.");
        setRetryCount(0);
      }
    } finally {
      if (attempt >= RETRY_CONFIG.maxRetries || !retryTimeoutRef.current) {
        setLoadingRates(false);
      }
    }
  };

  const handleManualRetry = () => {
    setRetryCount(0);
    setRetryError(null);
    fetchShippingRatesWithRetry(0);
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingData.name || !shippingData.email || !shippingData.address || !shippingData.postalCode) {
      toast.error("Please fill in all required fields");
      return;
    }
    setStep("delivery");
  };

  const handleDeliverySubmit = () => {
    if (!selectedShipping) {
      toast.error("Please select a shipping method");
      return;
    }
    setStep("payment");
  };

  const handlePaymentSubmit = async () => {
    // Prevent duplicate submissions
    if (isSubmitting) return;
    setIsSubmitting(true);
    setLoading(true);
    try {
      // Stock validation before order creation
      const productIds = items.map(item => item.productId);
      const { data: stockCheck } = await supabase
        .from('products')
        .select('id, name, stock_quantity, allow_backorder')
        .in('id', productIds);
      
      if (stockCheck) {
        const unavailable = items.filter(item => {
          const product = stockCheck.find(p => p.id === item.productId);
          if (!product) return true;
          return product.stock_quantity < item.quantity && !product.allow_backorder;
        });
        
        if (unavailable.length > 0) {
          const names = unavailable.map(i => i.name).join(', ');
          toast.error(`The following items are no longer available in the requested quantity: ${names}. Please update your cart.`);
          setLoading(false);
          setIsSubmitting(false);
          return;
        }
      }

      // Create order - pass user ID and selected payment gateway
      const orderResult = await createOrder(
        items.map((item) => ({
          productId: item.productId,
          productName: item.name,
          productSku: item.sku,
          quantity: item.quantity,
          unitPrice: item.price,
          includeRooting: item.includeRooting,
        })),
        shippingData,
        selectedShipping?.service || "Standard",
        shippingCost,
        rootingCost,
        user?.id,
        appliedPromo || undefined,
        promoDiscount,
        paymentMethod
      );

      if (!orderResult.success || !orderResult.orderId) {
        throw new Error(orderResult.error || "Failed to create order");
      }

      // Send order confirmation email (don't block payment flow on email failure)
      sendOrderConfirmationEmail(orderResult.orderId, shippingData.email).catch((err) => {
        console.warn("Failed to send confirmation email:", err);
      });

      const returnUrl = `${window.location.origin}/order-success?order=${orderResult.orderNumber}`;
      const cancelUrl = `${window.location.origin}/checkout`;

      // Clear saved checkout state before redirect
      clearSavedState();

      let paymentResult;
      if (paymentMethod === "payfast") {
        const payfastResult = await initiatePayFastPayment(
          orderResult.orderId,
          total,
          `African Vibe Order ${orderResult.orderNumber}`,
          shippingData.email,
          shippingData.name,
          returnUrl,
          cancelUrl
        );

        if (!payfastResult.success || !payfastResult.actionUrl || !payfastResult.formFields) {
          throw new Error(payfastResult.error || "PayFast payment initiation failed");
        }

        // Clear cart before redirect
        clearCart();

        // Create and submit a hidden form for PayFast POST
        const form = document.createElement("form");
        form.method = "POST";
        form.action = payfastResult.actionUrl;
        form.style.display = "none";

        for (const [key, value] of Object.entries(payfastResult.formFields)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
        return;
      } else {
        paymentResult = await initiateYocoPayment(
          orderResult.orderId,
          total,
          "ZAR",
          returnUrl,
          cancelUrl,
          shippingData.email
        );

        if (!paymentResult.success || !paymentResult.redirectUrl) {
          throw new Error(paymentResult.error || "Payment initiation failed");
        }

        // Clear cart and redirect to Yoco
        clearCart();
        window.location.href = paymentResult.redirectUrl;
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <CartSidebar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-20">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h1 className="text-2xl font-display font-bold mb-2">Your cart is empty</h1>
              <p className="text-muted-foreground mb-6">Add some products to continue</p>
              <Button onClick={() => navigate("/products")} className="btn-sunset">
                Browse Products
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const steps = [
    { id: "shipping", label: "Shipping", icon: MapPin },
    { id: "delivery", label: "Delivery", icon: Truck },
    { id: "payment", label: "Payment", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Header />
      <CartSidebar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-center mb-8 text-gradient-sunset">
            Checkout
          </h1>

          {/* Steps indicator */}
          <div className="flex justify-center mb-10">
            <div className="flex items-center gap-2 md:gap-4">
              {steps.map((s, index) => (
                <div key={s.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      step === s.id
                        ? "bg-primary text-primary-foreground"
                        : steps.findIndex((st) => st.id === step) > index
                        ? "bg-green-500/20 text-green-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {steps.findIndex((st) => st.id === step) > index ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <s.icon className="h-4 w-4" />
                    )}
                    <span className="hidden md:inline font-medium">{s.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-8 md:w-16 h-px bg-border mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {step === "shipping" && (
                  <motion.div
                    key="shipping"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          Shipping Address
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleShippingSubmit} className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Full Name *</Label>
                              <Input
                                id="name"
                                value={shippingData.name}
                                onChange={(e) => setShippingData({ ...shippingData, name: e.target.value })}
                                placeholder="John Doe"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email Address *</Label>
                              <Input
                                id="email"
                                type="email"
                                value={shippingData.email}
                                onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                                placeholder="john@example.com"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                              id="phone"
                              value={shippingData.phone}
                              onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                              placeholder="+27 83 123 4567"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="address">Street Address *</Label>
                            <Input
                              id="address"
                              value={shippingData.address}
                              onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                              placeholder="123 Main Street, Apartment 4"
                              required
                            />
                          </div>

                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="city">City *</Label>
                              <Input
                                id="city"
                                value={shippingData.city}
                                onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                                placeholder="Cape Town"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="province">Province *</Label>
                              <Input
                                id="province"
                                value={shippingData.province}
                                onChange={(e) => setShippingData({ ...shippingData, province: e.target.value })}
                                placeholder="Western Cape"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="postalCode">Postal Code *</Label>
                              <Input
                                id="postalCode"
                                value={shippingData.postalCode}
                                onChange={(e) => setShippingData({ ...shippingData, postalCode: e.target.value })}
                                placeholder="8001"
                                required
                              />
                            </div>
                          </div>

                          <Button type="submit" className="w-full btn-sunset mt-6">
                            Continue to Delivery
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {step === "delivery" && (
                  <motion.div
                    key="delivery"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Truck className="h-5 w-5 text-primary" />
                          Delivery Method
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Shipping Method Selection */}
                        <div className="space-y-4">
                          <h4 className="font-medium flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Shipping Method
                            <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Required</span>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Choose your preferred delivery option
                          </p>
                          
                          {loadingRates ? (
                            <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              <span className="mt-2 text-muted-foreground">
                                {retryCount > 0 
                                  ? `Retrying... (attempt ${retryCount}/${RETRY_CONFIG.maxRetries})`
                                  : "Loading shipping options..."}
                              </span>
                              {retryError && (
                                <span className="text-xs text-muted-foreground mt-1">{retryError}</span>
                              )}
                            </div>
                          ) : retryError ? (
                            <div className="p-6 rounded-lg border border-dashed bg-destructive/5 text-center">
                              <RefreshCw className="h-8 w-8 mx-auto text-destructive mb-2" />
                              <p className="text-destructive mb-3">{retryError}</p>
                              <div className="flex gap-2 justify-center">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={handleManualRetry}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Retry
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    setStep("shipping");
                                    toast.info("Please check your postal code");
                                  }}
                                >
                                  Update Address
                                </Button>
                              </div>
                            </div>
                          ) : shippingRates.length === 0 ? (
                            <div className="p-6 rounded-lg border border-dashed bg-muted/30 text-center">
                              <Truck className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-muted-foreground mb-3">No shipping rates found for this postal code</p>
                              <div className="flex gap-2 justify-center">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={handleManualRetry}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Refresh Rates
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    setStep("shipping");
                                    toast.info("Please check your postal code");
                                  }}
                                >
                                  Update Address
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <RadioGroup
                              value={selectedShipping?.service || ""}
                              onValueChange={(value) => {
                                const rate = shippingRates.find((r) => r.service === value);
                                setSelectedShipping(rate || null);
                                setSelectedLocker(null);
                              }}
                              className="space-y-3"
                            >
                              {shippingRates.map((rate) => (
                                <div
                                  key={`${rate.provider}-${rate.service}`}
                                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                                    selectedShipping?.service === rate.service
                                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                  onClick={() => {
                                    setSelectedShipping(rate);
                                    setSelectedLocker(null);
                                  }}
                                >
                                  <RadioGroupItem value={rate.service} id={rate.service} />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      {rate.provider === "pudo" ? (
                                        <Package className="h-4 w-4 text-primary" />
                                      ) : (
                                        <Truck className="h-4 w-4 text-primary" />
                                      )}
                                      <span className="font-medium">{rate.service}</span>
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                                        {rate.provider === "pudo" ? "PUDO Locker" : "Courier Guy"}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {rate.description} • {rate.estimatedDays}
                                    </p>
                                  </div>
                                  <span className="font-semibold text-primary">
                                    {formatPrice(rate.price)}
                                  </span>
                                </div>
                              ))}
                            </RadioGroup>
                          )}

                          {/* PUDO Locker Selection */}
                          {selectedShipping?.provider === "pudo" && pudoLockers.length > 0 && (
                            <div className="mt-4 p-4 rounded-lg bg-muted/30 border">
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                Select a PUDO Locker
                              </h4>
                              <RadioGroup
                                value={selectedLocker?.id || ""}
                                onValueChange={(value) => {
                                  const locker = pudoLockers.find((l) => l.id === value);
                                  setSelectedLocker(locker || null);
                                }}
                                className="space-y-2"
                              >
                                {pudoLockers.map((locker) => (
                                  <div
                                    key={locker.id}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border bg-background transition-all cursor-pointer ${
                                      selectedLocker?.id === locker.id
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                    }`}
                                    onClick={() => setSelectedLocker(locker)}
                                  >
                                    <RadioGroupItem value={locker.id} id={locker.id} />
                                    <div className="flex-1">
                                      <span className="font-medium">{locker.name}</span>
                                      <p className="text-sm text-muted-foreground">{locker.address}</p>
                                    </div>
                                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                      {locker.availableSlots} slots
                                    </span>
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Export Certifications */}
                        <ExportCertifications
                          options={certifications}
                          onChange={setCertifications}
                          formatPrice={formatPrice}
                        />

                        <div className="flex gap-3 mt-6">
                          <Button variant="outline" onClick={() => setStep("shipping")} className="flex-1">
                            Back
                          </Button>
                          <Button onClick={handleDeliverySubmit} className="flex-1 btn-sunset">
                            Continue to Payment
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {step === "payment" && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                          Payment Method
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Only Yoco payment - PayFast hidden */}
                        <div
                          className="flex items-center space-x-3 p-4 rounded-lg border border-primary bg-primary/5 ring-1 ring-primary"
                        >
                          <CreditCard className="h-5 w-5 text-[#00A8E8]" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#00A8E8]">Pay with Card (Yoco)</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                Secure
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Visa, Mastercard with 3D Secure
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            🔒 Your payment is secured with SSL encryption. We never store your card details.
                          </p>
                        </div>

                        <div className="flex gap-3 mt-6">
                          <Button variant="outline" onClick={() => setStep("delivery")} className="flex-1">
                            Back
                          </Button>
                          <Button
                            onClick={handlePaymentSubmit}
                            disabled={loading}
                            className="flex-1 btn-sunset"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Processing...
                              </>
                            ) : (
                              `Pay ${formatPrice(total)}`
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <Card className="glass-card sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                          {item.includeRooting && " • Rooting"}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  {/* Promo Code */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      Promo Code
                    </label>
                    {appliedPromo ? (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div>
                          <span className="font-mono font-bold text-green-600 text-sm">{appliedPromo}</span>
                          <span className="text-xs text-green-600 ml-2">-{formatPrice(promoDiscount)}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemovePromo}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={promoCode}
                          onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(null); }}
                          placeholder="Enter code"
                          className="text-sm h-9"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleApplyPromo}
                          disabled={promoLoading || !promoCode.trim()}
                          className="h-9 px-3"
                        >
                          {promoLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                    )}
                    {promoError && <p className="text-xs text-destructive">{promoError}</p>}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {rootingCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Rooting Service</span>
                        <span className="text-primary">{formatPrice(rootingCost)}</span>
                      </div>
                    )}
                    {certificationCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Export Certifications</span>
                        <span className="text-primary">{formatPrice(certificationCost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span className={selectedShipping ? "text-primary" : "text-muted-foreground"}>
                        {selectedShipping 
                          ? formatPrice(shippingCost) 
                          : step === "shipping" 
                            ? "Calculated at next step" 
                            : "Select shipping method"}
                      </span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({appliedPromo})</span>
                        <span>-{formatPrice(promoDiscount)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-gradient-sunset">{formatPrice(total)}</span>
                  </div>

                  {currency === "USD" && (
                    <p className="text-xs text-muted-foreground text-center">
                      * Prices converted from ZAR. Payment processed in ZAR.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
