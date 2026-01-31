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

// Get ALL shipping rates from the database (PUDO, custom, etc.)
async function getDatabaseShippingRates(
  supabase: any,
  destination: string,
  weight: number,
  dimensions?: { length: number; width: number; height: number },
  providerFilter?: string
): Promise<ShippingRate[]> {
  try {
    // Build query - get all active rates from database
    let query = supabase
      .from('shipping_rates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    // If specific provider filter is provided, use it
    if (providerFilter && providerFilter !== 'all') {
      if (providerFilter === 'pudo') {
        query = query.in('provider', ['pudo', 'pudo_locker']);
      } else if (providerFilter === 'database') {
        // Get all non-courier_guy rates from database (custom, pudo, etc.)
        query = query.not('provider', 'eq', 'courier_guy');
      } else {
        query = query.eq('provider', providerFilter);
      }
    }

    const { data: dbRates, error } = await query;

    if (error) {
      console.error("Error fetching shipping rates from DB:", error);
      return getFallbackPudoRates(weight, dimensions);
    }

    if (!dbRates || dbRates.length === 0) {
      console.log("No shipping rates found in database");
      return [];
    }

    console.log(`Found ${dbRates.length} shipping rates in database`);

    // Find matching rates based on weight and dimensions
    const matchingRates: ShippingRate[] = [];

    for (const rate of dbRates) {
      // Check weight limit (if max_weight_kg is 0, treat as no limit)
      if (rate.max_weight_kg > 0 && weight > rate.max_weight_kg) {
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

      // Format provider name for display
      let displayProvider = rate.provider;
      if (rate.provider === 'pudo' || rate.provider === 'pudo_locker') {
        displayProvider = 'PUDO';
      } else if (rate.provider === 'custom') {
        displayProvider = 'Custom Shipping';
      } else if (rate.provider === 'courier_guy') {
        displayProvider = 'The Courier Guy';
      }

      matchingRates.push({
        provider: rate.provider,
        service: rate.service_name,
        price: parseFloat(rate.price_zar),
        estimatedDays: rate.description?.includes('day') ? rate.description : "2-5 business days",
        description: rate.description || `${displayProvider} - ${rate.service_name}`,
      });
    }

    console.log(`${matchingRates.length} rates match weight/dimension criteria`);
    return matchingRates;
  } catch (error) {
    console.error("Database shipping rates error:", error);
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
    // Use service role key to bypass RLS and ensure we can always read shipping rates
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
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

    // Get ALL database-configured shipping rates (custom, pudo, etc.)
    // This includes all rates added via the admin panel
    const dbRates = await getDatabaseShippingRates(
      supabase,
      destinationPostalCode,
      weight,
      dimensions,
      provider === "all" ? undefined : provider
    );
    console.log("Database shipping rates:", dbRates);
    rates.push(...dbRates);

    // ALWAYS get Courier Guy API/fallback rates for domestic shipping options
    if (provider === "all" || provider === "courier_guy") {
      const courierRates = await getCourierGuyRates(
        courierGuyApiKey || "",
        originPostalCode,
        destinationPostalCode,
        weight,
        dimensions
      );
      console.log("Courier Guy API rates:", courierRates);
      
      // Add courier rates that don't duplicate existing database rates
      for (const rate of courierRates) {
        const isDuplicate = rates.some(r => 
          r.provider === rate.provider && r.service === rate.service
        );
        if (!isDuplicate) {
          rates.push(rate);
        }
      }
    }

    // ALWAYS add PUDO fallback rates for locker delivery options
    if (provider === "all" || provider === "pudo") {
      const pudoFallback = getFallbackPudoRates(weight, dimensions);
      console.log("PUDO fallback rates:", pudoFallback);
      
      // Add PUDO rates that don't duplicate existing
      for (const rate of pudoFallback) {
        const isDuplicate = rates.some(r => 
          r.provider === rate.provider && r.service === rate.service
        );
        if (!isDuplicate) {
          rates.push(rate);
        }
      }
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
