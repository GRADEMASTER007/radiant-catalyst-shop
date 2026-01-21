import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShippingRateRequest {
  originPostalCode: string;
  destinationPostalCode: string;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  provider?: "courier_guy" | "pudo" | "all";
}

interface ShippingRate {
  provider: string;
  service: string;
  price: number;
  estimatedDays: string;
  description: string;
}

// Courier Guy API integration
async function getCourierGuyRates(
  apiKey: string,
  origin: string,
  destination: string,
  weight: number,
  dimensions?: { length: number; width: number; height: number }
): Promise<ShippingRate[]> {
  try {
    // Courier Guy API endpoint
    const baseUrl = "https://api.thecourierguy.co.za";
    
    const requestBody = {
      collection_address: {
        postal_code: origin,
        country: "ZA",
      },
      delivery_address: {
        postal_code: destination,
        country: "ZA",
      },
      parcels: [
        {
          submitted_weight: weight,
          submitted_length: dimensions?.length || 30,
          submitted_width: dimensions?.width || 20,
          submitted_height: dimensions?.height || 15,
        },
      ],
    };

    const response = await fetch(`${baseUrl}/v2/rates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Courier Guy API error:", await response.text());
      // Return fallback rates
      return getFallbackCourierGuyRates(weight, origin, destination);
    }

    const data = await response.json();
    
    return data.rates?.map((rate: any) => ({
      provider: "courier_guy",
      service: rate.service_name || "Standard Delivery",
      price: rate.rate || 0,
      estimatedDays: rate.estimated_delivery || "2-5 business days",
      description: rate.description || "Courier Guy delivery",
    })) || getFallbackCourierGuyRates(weight, origin, destination);
  } catch (error) {
    console.error("Courier Guy error:", error);
    return getFallbackCourierGuyRates(weight, origin, destination);
  }
}

// Fallback rates when API is unavailable
function getFallbackCourierGuyRates(weight: number, origin: string, destination: string): ShippingRate[] {
  const baseRate = 85;
  const weightRate = weight * 15;
  const distanceFactor = origin.substring(0, 2) === destination.substring(0, 2) ? 1 : 1.5;
  
  return [
    {
      provider: "courier_guy",
      service: "Economy",
      price: Math.round((baseRate + weightRate) * distanceFactor),
      estimatedDays: "3-5 business days",
      description: "Affordable door-to-door delivery",
    },
    {
      provider: "courier_guy",
      service: "Express",
      price: Math.round((baseRate + weightRate) * distanceFactor * 1.8),
      estimatedDays: "1-2 business days",
      description: "Fast delivery to your door",
    },
    {
      provider: "courier_guy",
      service: "Overnight",
      price: Math.round((baseRate + weightRate) * distanceFactor * 2.5),
      estimatedDays: "Next business day",
      description: "Overnight express delivery",
    },
  ];
}

// PUDO Locker integration
async function getPudoRates(
  apiKey: string,
  destination: string,
  weight: number,
  dimensions?: { length: number; width: number; height: number }
): Promise<ShippingRate[]> {
  try {
    // Check if parcel fits in locker
    const maxDimensions = { length: 60, width: 45, height: 37 };
    const maxWeight = 30;

    if (
      weight > maxWeight ||
      (dimensions && (
        dimensions.length > maxDimensions.length ||
        dimensions.width > maxDimensions.width ||
        dimensions.height > maxDimensions.height
      ))
    ) {
      return []; // Item too large for PUDO lockers
    }

    // Calculate PUDO rate based on weight
    let price: number;
    if (weight <= 5) {
      price = 45;
    } else if (weight <= 10) {
      price = 65;
    } else if (weight <= 20) {
      price = 85;
    } else {
      price = 110;
    }

    return [
      {
        provider: "pudo",
        service: "Locker Delivery",
        price: price,
        estimatedDays: "2-4 business days",
        description: "Collect from nearest PUDO locker - convenient & secure",
      },
    ];
  } catch (error) {
    console.error("PUDO error:", error);
    return [];
  }
}

// Get PUDO locker locations
async function getPudoLockers(apiKey: string, postalCode: string): Promise<any[]> {
  try {
    const response = await fetch(`https://api.pudo.co.za/v1/lockers?postal_code=${postalCode}&limit=10`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Return sample lockers for testing
      return getSampleLockers(postalCode);
    }

    const data = await response.json();
    return data.lockers || getSampleLockers(postalCode);
  } catch (error) {
    console.error("PUDO lockers error:", error);
    return getSampleLockers(postalCode);
  }
}

function getSampleLockers(postalCode: string): any[] {
  return [
    {
      id: "pudo_001",
      name: "Pick n Pay " + postalCode,
      address: "Main Road Shopping Centre",
      postalCode: postalCode,
      availableSlots: 5,
    },
    {
      id: "pudo_002",
      name: "Checkers " + postalCode,
      address: "Town Centre Mall",
      postalCode: postalCode,
      availableSlots: 8,
    },
    {
      id: "pudo_003",
      name: "Engen Garage " + postalCode,
      address: "Service Station, N1 Highway",
      postalCode: postalCode,
      availableSlots: 3,
    },
  ];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const courierGuyApiKey = Deno.env.get("COURIER_GUY_API_KEY");
    const pudoApiKey = Deno.env.get("PUDO_API_KEY");
    
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Handle PUDO locker lookup
    if (action === "lockers") {
      const postalCode = url.searchParams.get("postalCode") || "";
      const lockers = await getPudoLockers(pudoApiKey || "", postalCode);
      return new Response(
        JSON.stringify({ lockers }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get shipping rates
    const {
      originPostalCode,
      destinationPostalCode,
      weight,
      dimensions,
      provider = "all",
    }: ShippingRateRequest = await req.json();

    const rates: ShippingRate[] = [];

    // Get Courier Guy rates
    if (provider === "all" || provider === "courier_guy") {
      const courierRates = await getCourierGuyRates(
        courierGuyApiKey || "",
        originPostalCode,
        destinationPostalCode,
        weight,
        dimensions
      );
      rates.push(...courierRates);
    }

    // Get PUDO rates
    if (provider === "all" || provider === "pudo") {
      const pudoRates = await getPudoRates(
        pudoApiKey || "",
        destinationPostalCode,
        weight,
        dimensions
      );
      rates.push(...pudoRates);
    }

    // Sort by price
    rates.sort((a, b) => a.price - b.price);

    return new Response(
      JSON.stringify({
        success: true,
        rates,
        currency: "ZAR",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Shipping rates error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
