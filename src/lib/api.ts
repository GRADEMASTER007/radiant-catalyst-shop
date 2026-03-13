import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface ShippingRate {
  provider: string;
  service: string;
  price: number;
  estimatedDays: string;
  description: string;
}

export interface PudoLocker {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  availableSlots: number;
}

export interface CurrencyRates {
  ZAR_TO_USD: number;
  USD_TO_ZAR: number;
}

// Get shipping rates
export async function getShippingRates(
  originPostalCode: string,
  destinationPostalCode: string,
  weight: number,
  dimensions?: { length: number; width: number; height: number }
): Promise<ShippingRate[]> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/shipping-rates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originPostalCode,
        destinationPostalCode,
        weight,
        dimensions,
        provider: "all",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch shipping rates");
    }

    const data = await response.json();
    return data.rates || [];
  } catch (error) {
    console.error("Shipping rates error:", error);
    return [];
  }
}

// Get PUDO locker locations
export async function getPudoLockers(postalCode: string): Promise<PudoLocker[]> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/shipping-rates?action=lockers&postalCode=${postalCode}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch PUDO lockers");
    }

    const data = await response.json();
    return data.lockers || [];
  } catch (error) {
    console.error("PUDO lockers error:", error);
    return [];
  }
}

// Get currency exchange rates
export async function getCurrencyRates(): Promise<CurrencyRates> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/currency-convert?action=rates`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch currency rates");
    }

    const data = await response.json();
    return data.rates || { ZAR_TO_USD: 0.055, USD_TO_ZAR: 18.18 };
  } catch (error) {
    console.error("Currency rates error:", error);
    return { ZAR_TO_USD: 0.055, USD_TO_ZAR: 18.18 };
  }
}

// Convert currency
export async function convertCurrency(
  amount: number,
  from: "ZAR" | "USD",
  to: "ZAR" | "USD"
): Promise<number> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/currency-convert?action=convert&amount=${amount}&from=${from}&to=${to}`
    );

    if (!response.ok) {
      throw new Error("Failed to convert currency");
    }

    const data = await response.json();
    return data.converted?.amount || amount;
  } catch (error) {
    console.error("Currency conversion error:", error);
    return amount;
  }
}

// PayFast payment response type
export interface PayFastPaymentResult {
  success: boolean;
  actionUrl?: string;
  formFields?: Record<string, string>;
  paymentId?: string;
  error?: string;
}

// Initiate PayFast payment - returns form data for POST submission
export async function initiatePayFastPayment(
  orderId: string,
  amount: number,
  itemName: string,
  customerEmail: string,
  customerName: string,
  returnUrl: string,
  cancelUrl: string
): Promise<PayFastPaymentResult> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/payfast-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        amount,
        itemName,
        customerEmail,
        customerName,
        returnUrl,
        cancelUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Payment initiation failed");
    }

    return await response.json();
  } catch (error: any) {
    console.error("PayFast payment error:", error);
    return { success: false, error: error.message };
  }
}

// Initiate Yoco payment
export async function initiateYocoPayment(
  orderId: string,
  amount: number,
  currency: string,
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string
): Promise<{ success: boolean; redirectUrl?: string; checkoutId?: string; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/yoco-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        amount,
        currency,
        successUrl,
        cancelUrl,
        customerEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Payment initiation failed");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Yoco payment error:", error);
    return { success: false, error: error.message };
  }
}

// Create order in database
export async function createOrder(
  items: Array<{
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    includeRooting?: boolean;
  }>,
  shippingAddress: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
  },
  shippingMethod: string,
  shippingCost: number,
  rootingCost: number = 0,
  customerId?: string,
  couponCode?: string,
  couponDiscount: number = 0,
  paymentGateway?: string
): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {
  try {
    const generateOrderNumber = () => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
      return `ORD-${yyyy}${mm}${dd}-${rand}`;
    };

    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = subtotal + shippingCost + rootingCost - couponDiscount;

    // Build notes with rooting info if applicable
    const rootingItems = items.filter(i => i.includeRooting);
    const rootingNote = rootingItems.length > 0 
      ? `Rooting Service: ${rootingItems.reduce((sum, i) => sum + i.quantity, 0)} plants @ R${(rootingCost / rootingItems.reduce((sum, i) => sum + i.quantity, 0)).toFixed(2)}/plant = R${rootingCost.toFixed(2)}`
      : null;

    // Check current auth state
    const { data: { session } } = await supabase.auth.getSession();
    const authenticatedUserId = session?.user?.id;
    
    console.log("Creating order - Auth state:", { 
      hasSession: !!session, 
      userId: authenticatedUserId,
      passedCustomerId: customerId 
    });

    // Guest checkout (anon): create order + items server-side to avoid RLS failures
    if (!authenticatedUserId) {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          shippingAddress,
          shippingMethod,
          shippingCost,
          rootingCost,
          couponCode,
          couponDiscount,
          paymentGateway,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Failed to create order");
      }

      return {
        success: true,
        orderId: data.orderId,
        orderNumber: data.orderNumber,
      };
    }

    // Authenticated checkout: proceed with direct inserts under RLS
    const effectiveCustomerId = customerId || authenticatedUserId;

    // Pre-generate identifiers so we can insert with return=minimal (avoids SELECT/RLS issues on anon)
    const orderId = crypto.randomUUID();
    const orderNumber = generateOrderNumber();
    const accessToken = crypto.randomUUID();

    // If this is an authenticated checkout, ensure a matching customers row exists
    // (orders.customer_id has an FK to customers.id, and older accounts may not have this row).
    if (authenticatedUserId && effectiveCustomerId === authenticatedUserId) {
      const fullName = (shippingAddress.name || "").trim();
      const firstName = fullName.split(" ")[0] || null;
      const lastName = fullName.split(" ").slice(1).join(" ") || null;

      const { error: customerUpsertError } = await supabase
        .from("customers")
        .upsert(
          {
            id: authenticatedUserId,
            email: shippingAddress.email,
            first_name: firstName,
            last_name: lastName,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          } as any,
          { onConflict: "id" }
        );

      if (customerUpsertError) {
        console.warn("Customer upsert warning (continuing):", customerUpsertError);
      }
    }
    
    const orderData: Record<string, unknown> = {
      id: orderId,
      order_number: orderNumber,
      access_token: accessToken,
      shipping_address: shippingAddress,
      billing_address: shippingAddress,
      shipping_method: shippingMethod,
      shipping_cost_zar: shippingCost,
      subtotal_zar: subtotal + rootingCost,
      discount_zar: couponDiscount,
      total_zar: total,
      status: "pending",
      payment_status: "pending",
      notes: rootingNote,
      coupon_code: couponCode || null,
      coupon_discount_zar: couponDiscount,
    };

    // Set customer_id for authenticated users, guest_email for guests
    // IMPORTANT: only set customer_id when it matches the current authenticated user.
    // If a mismatched id is ever passed, fall back to guest checkout to avoid FK/RLS issues.
    if (authenticatedUserId && effectiveCustomerId === authenticatedUserId) {
      orderData.customer_id = authenticatedUserId;
      orderData.guest_email = shippingAddress.email; // Also store email for reference
    } else {
      // Guest checkout - no customer_id, just guest_email
      orderData.guest_email = shippingAddress.email;
    }

    console.log("Order data being inserted:", orderData);

    // Create order.
    // IMPORTANT: Do NOT select the inserted row for anon users — that would require SELECT policies.
    const { error: orderError } = await supabase
      .from("orders")
      .insert(orderData as any);

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error(orderError.message);
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      product_name: item.productName,
      product_sku: item.productSku,
      quantity: item.quantity,
      unit_price_zar: item.unitPrice,
      total_price_zar: item.unitPrice * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
      throw new Error(itemsError.message);
    }

    return {
      success: true,
      orderId,
      orderNumber,
    };
  } catch (error: any) {
    console.error("Create order error:", error);
    return { success: false, error: error.message };
  }
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(
  orderId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "order_confirmation",
        orderId,
        email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send confirmation email");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
}

// Send rooting ready notification email
export async function sendRootingReadyEmail(
  orderId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "rooting_ready",
        orderId,
        email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send rooting ready email");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Rooting ready email error:", error);
    return { success: false, error: error.message };
  }
}
