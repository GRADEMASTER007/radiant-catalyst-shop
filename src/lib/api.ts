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

// Initiate PayFast payment
export async function initiatePayFastPayment(
  orderId: string,
  amount: number,
  itemName: string,
  customerEmail: string,
  customerName: string,
  returnUrl: string,
  cancelUrl: string
): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
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
  customerId?: string
): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {
  try {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = subtotal + shippingCost + rootingCost;

    // Build notes with rooting info if applicable
    const rootingItems = items.filter(i => i.includeRooting);
    const rootingNote = rootingItems.length > 0 
      ? `Rooting Service: ${rootingItems.reduce((sum, i) => sum + i.quantity, 0)} plants @ R${(rootingCost / rootingItems.reduce((sum, i) => sum + i.quantity, 0)).toFixed(2)}/plant = R${rootingCost.toFixed(2)}`
      : null;

    // Build order data
    const orderData: Record<string, unknown> = {
      guest_email: shippingAddress.email,
      shipping_address: shippingAddress,
      billing_address: shippingAddress,
      shipping_method: shippingMethod,
      shipping_cost_zar: shippingCost,
      subtotal_zar: subtotal + rootingCost, // Include rooting in subtotal for display
      total_zar: total,
      status: "pending",
      payment_status: "pending",
      notes: rootingNote,
    };

    if (customerId) {
      orderData.customer_id = customerId;
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData as any)
      .select()
      .single();

    if (orderError) {
      throw new Error(orderError.message);
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
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
    }

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
    };
  } catch (error: any) {
    console.error("Create order error:", error);
    return { success: false, error: error.message };
  }
}
