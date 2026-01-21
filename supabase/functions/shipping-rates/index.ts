import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

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

// The Courier Guy API integration
// Docs: https://thecourierguy.co.za/integrations/
async function getCourierGuyRates(
  apiKey: string,
  origin: string,
  destination: string,
  weight: number,
  dimensions?: { length: number; width: number; height: number }
): Promise<ShippingRate[]> {
  try {
    if (!apiKey) {
      console.log("No Courier Guy API key, using fallback rates");
      return getFallbackCourierGuyRates(weight, origin, destination);
    }

    // The Courier Guy Ship Logic API
    const baseUrl = "https://api.shiplogic.com";
    
    const requestBody = {
      collection_address: {
        type: "residential",
        postal_code: origin,
        country: "ZA",
      },
      delivery_address: {
        type: "residential", 
        postal_code: destination,
        country: "ZA",
      },
      parcels: [
        {
          submitted_weight_kg: weight,
          submitted_length_cm: dimensions?.length || 30,
          submitted_width_cm: dimensions?.width || 20,
          submitted_height_cm: dimensions?.height || 15,
        },
      ],
    };

    console.log("Calling Courier Guy API with:", JSON.stringify(requestBody));

    const response = await fetch(`${baseUrl}/v2/rates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("Courier Guy API response:", response.status, responseText);

    if (!response.ok) {
      console.error("Courier Guy API error:", responseText);
      return getFallbackCourierGuyRates(weight, origin, destination);
    }

    const data = JSON.parse(responseText);
    
    if (data.rates && Array.isArray(data.rates) && data.rates.length > 0) {
      return data.rates.map((rate: any) => ({
        provider: "courier_guy",
        service: rate.service_name || rate.service_level?.name || "Standard",
        price: Math.round((rate.rate?.amount || rate.total_charge || rate.rate || 0) * 100) / 100,
        estimatedDays: rate.time_in_transit 
          ? `${rate.time_in_transit} business days`
          : rate.delivery_date_to 
            ? `Delivery by ${rate.delivery_date_to}`
            : "2-5 business days",
        description: rate.description || `${rate.service_name || "Standard"} delivery via The Courier Guy`,
      })).filter((r: ShippingRate) => r.price > 0);
    }
    
    return getFallbackCourierGuyRates(weight, origin, destination);
  } catch (error) {
    console.error("Courier Guy error:", error);
    return getFallbackCourierGuyRates(weight, origin, destination);
  }
}

// Fallback rates when API is unavailable
function getFallbackCourierGuyRates(weight: number, origin: string, destination: string): ShippingRate[] {
  // Base pricing structure
  const baseRate = 85;
  const weightRate = Math.max(weight, 1) * 12;
  
  // Distance factor based on postal code comparison
  const sameRegion = origin.substring(0, 2) === destination.substring(0, 2);
  const sameCity = origin.substring(0, 3) === destination.substring(0, 3);
  
  let distanceFactor = 1.8; // Default inter-provincial
  if (sameCity) {
    distanceFactor = 1.0;
  } else if (sameRegion) {
    distanceFactor = 1.3;
  }
  
  const economyPrice = Math.round((baseRate + weightRate) * distanceFactor);
  
  return [
    {
      provider: "courier_guy",
      service: "Economy",
      price: economyPrice,
      estimatedDays: "3-5 business days",
      description: "Affordable door-to-door delivery",
    },
    {
      provider: "courier_guy",
      service: "Express",
      price: Math.round(economyPrice * 1.6),
      estimatedDays: "1-2 business days",
      description: "Fast delivery to your door",
    },
    {
      provider: "courier_guy",
      service: "Overnight",
      price: Math.round(economyPrice * 2.2),
      estimatedDays: "Next business day",
      description: "Overnight express delivery",
    },
  ];
}

// PUDO Locker integration using database rates
async function getPudoRates(
  supabase: any,
  destination: string,
  weight: number,
  dimensions?: { length: number; width: number; height: number }
): Promise<ShippingRate[]> {
  try {
    // Get PUDO rates from database
    const { data: dbRates, error } = await supabase
      .from('shipping_rates')
      .select('*')
      .in('provider', ['pudo', 'pudo_locker'])
      .eq('is_active', true)
      .order('sort_order');

    if (error || !dbRates || dbRates.length === 0) {
      console.error("Error fetching PUDO rates from DB:", error);
      // Fallback to hardcoded rates
      return getFallbackPudoRates(weight, dimensions);
    }

    // Find the best matching rate based on weight and dimensions
    const matchingRates: ShippingRate[] = [];

    for (const rate of dbRates) {
      // Check weight limit
      if (weight > rate.max_weight_kg) {
        continue;
      }

      // Check dimension limits if specified
      if (dimensions && rate.max_length_cm && rate.max_width_cm && rate.max_height_cm) {
        if (
          dimensions.length > rate.max_length_cm ||
          dimensions.width > rate.max_width_cm ||
          dimensions.height > rate.max_height_cm
        ) {
          continue;
        }
      }

      matchingRates.push({
        provider: rate.provider,
        service: `PUDO ${rate.service_name}`,
        price: parseFloat(rate.price_zar),
        estimatedDays: "2-4 business days",
        description: rate.description || `PUDO ${rate.service_name} - Max ${rate.max_weight_kg}kg`,
      });
    }

    // Return the cheapest matching rate (or all if none match constraints)
    if (matchingRates.length > 0) {
      // Sort by price and return cheapest
      matchingRates.sort((a, b) => a.price - b.price);
      return [matchingRates[0]];
    }

    // No matching rates - parcel too large/heavy
    console.log("No PUDO rates match for weight:", weight, "dimensions:", dimensions);
    return [];
  } catch (error) {
    console.error("PUDO rates error:", error);
    return getFallbackPudoRates(weight, dimensions);
  }
}

// Fallback PUDO rates if database is unavailable
function getFallbackPudoRates(
  weight: number,
  dimensions?: { length: number; width: number; height: number }
): ShippingRate[] {
  // Max limits for PUDO
  if (weight > 20) return [];
  if (dimensions && (dimensions.length > 60 || dimensions.width > 41 || dimensions.height > 69)) return [];

  let price: number;
  let size: string;

  if (weight <= 2) {
    price = 50;
    size = "Extra Small";
  } else if (weight <= 5) {
    price = 60;
    size = "Small";
  } else if (weight <= 10) {
    price = 100;
    size = "Medium";
  } else if (weight <= 15) {
    price = 150;
    size = "Large";
  } else {
    price = 200;
    size = "Extra Large";
  }

  return [{
    provider: "pudo",
    service: `PUDO ${size}`,
    price: price,
    estimatedDays: "2-4 business days",
    description: `PUDO Locker (${size}) - Max ${weight <= 2 ? 2 : weight <= 5 ? 5 : weight <= 10 ? 10 : weight <= 15 ? 15 : 20}kg`,
  }];
}

// Get PUDO locker locations
// API: https://api-pudo.co.za
async function getPudoLockers(apiKey: string, postalCode: string): Promise<any[]> {
  try {
    if (!apiKey) {
      console.log("No PUDO API key, using sample lockers");
      return getSampleLockers(postalCode);
    }

    // PUDO API endpoint
    const baseUrl = "https://api-pudo.co.za";
    
    console.log("Fetching PUDO lockers for postal code:", postalCode);
    
    const response = await fetch(`${baseUrl}/v1/lockers/search?postal_code=${postalCode}&limit=10`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log("PUDO API response:", response.status, responseText);

    if (!response.ok) {
      console.error("PUDO API error:", responseText);
      return getSampleLockers(postalCode);
    }

    const data = JSON.parse(responseText);
    
    if (data.lockers && Array.isArray(data.lockers) && data.lockers.length > 0) {
      return data.lockers.map((locker: any) => ({
        id: locker.id || locker.locker_id,
        name: locker.name || locker.display_name,
        address: locker.address || `${locker.street_address}, ${locker.suburb}`,
        postalCode: locker.postal_code || postalCode,
        availableSlots: locker.available_slots ?? locker.capacity ?? 5,
        latitude: locker.latitude,
        longitude: locker.longitude,
      }));
    }
    
    return getSampleLockers(postalCode);
  } catch (error) {
    console.error("PUDO lockers error:", error);
    return getSampleLockers(postalCode);
  }
}

// Sample lockers for testing/fallback
function getSampleLockers(postalCode: string): any[] {
  // Generate realistic sample lockers based on postal code region
  const regionCode = postalCode.substring(0, 2);
  
  // Map postal code regions to city names
  const regionNames: Record<string, string> = {
    "00": "Johannesburg CBD",
    "01": "Pretoria",
    "02": "Johannesburg North",
    "06": "Johannesburg South",
    "08": "Cape Town CBD",
    "75": "Cape Town South",
    "76": "Cape Town North",
    "40": "Durban",
    "60": "Port Elizabeth",
    "90": "Bloemfontein",
  };
  
  const cityName = regionNames[regionCode] || "Local Area";
  
  return [
    {
      id: `pudo_${postalCode}_001`,
      name: `Pick n Pay - ${cityName}`,
      address: `Main Road Shopping Centre, ${postalCode}`,
      postalCode: postalCode,
      availableSlots: 5,
    },
    {
      id: `pudo_${postalCode}_002`,
      name: `Checkers - ${cityName}`,
      address: `Town Centre Mall, ${postalCode}`,
      postalCode: postalCode,
      availableSlots: 8,
    },
    {
      id: `pudo_${postalCode}_003`,
      name: `Engen Garage - ${cityName}`,
      address: `Service Station, Main Road, ${postalCode}`,
      postalCode: postalCode,
      availableSlots: 3,
    },
    {
      id: `pudo_${postalCode}_004`,
      name: `Shell Ultra City - ${cityName}`,
      address: `Highway Convenience Centre, ${postalCode}`,
      postalCode: postalCode,
      availableSlots: 6,
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Handle PUDO locker lookup
    if (action === "lockers") {
      const postalCode = url.searchParams.get("postalCode") || "";
      console.log("Fetching PUDO lockers for:", postalCode);
      
      const lockers = await getPudoLockers(pudoApiKey || "", postalCode);
      return new Response(
        JSON.stringify({ success: true, lockers }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get shipping rates
    const body = await req.text();
    console.log("Shipping rates request:", body);
    
    const {
      originPostalCode,
      destinationPostalCode,
      weight,
      dimensions,
      provider = "all",
    }: ShippingRateRequest = JSON.parse(body);

    console.log("Processing rates for:", { originPostalCode, destinationPostalCode, weight, dimensions, provider });

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
      console.log("Courier Guy rates:", courierRates);
      rates.push(...courierRates);
    }

    // Get PUDO rates from database
    if (provider === "all" || provider === "pudo") {
      const pudoRates = await getPudoRates(
        supabase,
        destinationPostalCode,
        weight,
        dimensions
      );
      console.log("PUDO rates:", pudoRates);
      rates.push(...pudoRates);
    }

    // Sort by price
    rates.sort((a, b) => a.price - b.price);

    console.log("Final rates:", rates);

    return new Response(
      JSON.stringify({
        success: true,
        rates,
        currency: "ZAR",
        totalOptions: rates.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Shipping rates error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        rates: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
