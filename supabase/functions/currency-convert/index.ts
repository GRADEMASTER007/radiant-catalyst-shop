import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExchangeRateResponse {
  rates: {
    USD: number;
    ZAR: number;
  };
  base: string;
  timestamp: number;
}

// Cache exchange rates for 1 hour
let cachedRates: { usd: number; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getExchangeRate(): Promise<number> {
  // Check cache
  if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_DURATION) {
    return cachedRates.usd;
  }

  try {
    // Use a free exchange rate API
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/ZAR"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate");
    }

    const data = await response.json();
    const usdRate = data.rates?.USD || 0.055; // Fallback rate

    cachedRates = {
      usd: usdRate,
      timestamp: Date.now(),
    };

    return usdRate;
  } catch (error) {
    console.error("Exchange rate error:", error);
    // Return fallback rate
    return 0.055; // Approximately 1 ZAR = 0.055 USD
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "rates";

    if (action === "rates") {
      const zarToUsd = await getExchangeRate();
      const usdToZar = 1 / zarToUsd;

      return new Response(
        JSON.stringify({
          success: true,
          rates: {
            ZAR_TO_USD: zarToUsd,
            USD_TO_ZAR: usdToZar,
          },
          base: "ZAR",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "convert") {
      const amount = parseFloat(url.searchParams.get("amount") || "0");
      const from = url.searchParams.get("from")?.toUpperCase() || "ZAR";
      const to = url.searchParams.get("to")?.toUpperCase() || "USD";

      if (isNaN(amount)) {
        throw new Error("Invalid amount");
      }

      const zarToUsd = await getExchangeRate();
      let convertedAmount: number;

      if (from === "ZAR" && to === "USD") {
        convertedAmount = amount * zarToUsd;
      } else if (from === "USD" && to === "ZAR") {
        convertedAmount = amount / zarToUsd;
      } else {
        throw new Error("Only ZAR/USD conversion supported");
      }

      return new Response(
        JSON.stringify({
          success: true,
          original: { amount, currency: from },
          converted: { amount: Math.round(convertedAmount * 100) / 100, currency: to },
          rate: from === "ZAR" ? zarToUsd : 1 / zarToUsd,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    console.error("Currency conversion error:", error);
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
