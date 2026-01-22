import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/auth.ts";

// ==========================================
// SERPAPI SHARED DATA SERVICE
// Centralized search data for SEO, metadata, and AI enrichment
// 
// Endpoints: search, images, places, shopping
// Rate limiting: configurable per-scope
// Caching: 1 hour default
// ==========================================

interface SerpAPIRequest {
  endpoint: "search" | "images" | "places" | "shopping";
  query: string;
  scope?: string; // Which AI scope is calling (for limits)
  options?: {
    location?: string;
    num?: number;
    gl?: string; // Country code
    hl?: string; // Language code
    tbm?: string; // Search type
  };
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache (per function instance)
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Rate limit tracking per scope
const rateLimits = new Map<string, { count: number; resetAt: number }>();

// Default limits per scope (can be overridden in DB)
const SCOPE_LIMITS: Record<string, number> = {
  seo_optimization: 50, // 50 calls per hour
  content_generation: 30,
  image_prompt_generation: 20,
  default: 10,
};

function getCacheKey(request: SerpAPIRequest): string {
  return `${request.endpoint}:${request.query}:${JSON.stringify(request.options || {})}`;
}

function checkRateLimit(scope: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const limit = SCOPE_LIMITS[scope] || SCOPE_LIMITS.default;
  
  let entry = rateLimits.get(scope);
  
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + hourMs };
    rateLimits.set(scope, entry);
  }
  
  const remaining = limit - entry.count;
  const resetIn = Math.max(0, entry.resetAt - now);
  
  return {
    allowed: entry.count < limit,
    remaining,
    resetIn,
  };
}

function incrementRateLimit(scope: string): void {
  const entry = rateLimits.get(scope);
  if (entry) {
    entry.count++;
  }
}

async function callSerpAPI(
  apiKey: string, 
  endpoint: string, 
  query: string, 
  options: SerpAPIRequest["options"]
): Promise<any> {
  const baseUrl = "https://serpapi.com/search.json";

  const params = new URLSearchParams();
  params.set("api_key", apiKey);
  params.set("q", query);
  params.set("engine", "google");
  
  // Add optional parameters
  if (options?.location) params.set("location", options.location);
  if (options?.num) params.set("num", String(options.num));
  if (options?.gl) params.set("gl", options.gl);
  if (options?.hl) params.set("hl", options.hl);
  if (options?.tbm) params.set("tbm", options.tbm);
  // Add endpoint-specific parameters
  if (endpoint === "images") {
    params.set("tbm", "isch");
  } else if (endpoint === "places") {
    params.set("tbm", "lcl");
  } else if (endpoint === "shopping") {
    params.set("tbm", "shop");
  }

  const response = await fetch(`${baseUrl}?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`SerpAPI error: ${response.status}`);
  }

  return response.json();
}

function normalizeSearchResults(data: any): any {
  return {
    organic: (data.organic_results || []).slice(0, 10).map((r: any) => ({
      title: r.title,
      snippet: r.snippet,
      link: r.link,
      position: r.position,
    })),
    relatedSearches: (data.related_searches || []).map((r: any) => r.query),
    relatedQuestions: (data.related_questions || []).map((r: any) => ({
      question: r.question,
      snippet: r.snippet,
    })),
    knowledgeGraph: data.knowledge_graph ? {
      title: data.knowledge_graph.title,
      type: data.knowledge_graph.type,
      description: data.knowledge_graph.description,
    } : null,
  };
}

function normalizeImageResults(data: any): any {
  return {
    images: (data.images_results || []).slice(0, 20).map((r: any) => ({
      title: r.title,
      thumbnail: r.thumbnail,
      original: r.original,
      source: r.source,
    })),
  };
}

function normalizePlacesResults(data: any): any {
  return {
    places: (data.local_results || []).slice(0, 10).map((r: any) => ({
      title: r.title,
      address: r.address,
      rating: r.rating,
      reviews: r.reviews,
      type: r.type,
      phone: r.phone,
      website: r.website,
      coordinates: r.gps_coordinates,
    })),
  };
}

function normalizeShoppingResults(data: any): any {
  return {
    products: (data.shopping_results || []).slice(0, 20).map((r: any) => ({
      title: r.title,
      price: r.price,
      source: r.source,
      link: r.link,
      thumbnail: r.thumbnail,
      rating: r.rating,
      reviews: r.reviews,
    })),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    if (!SERPAPI_KEY) {
      throw new Error("SERPAPI_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { endpoint, query, scope = "default", options }: SerpAPIRequest = await req.json();

    if (!endpoint || !query) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: endpoint, query" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit for scope
    const rateCheck = checkRateLimit(scope);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded",
          remaining: rateCheck.remaining,
          resetIn: Math.ceil(rateCheck.resetIn / 1000),
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache
    const cacheKey = getCacheKey({ endpoint, query, scope, options });
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`Cache hit for: ${cacheKey}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: cached.data, 
          cached: true,
          scope,
          remaining: rateCheck.remaining,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment rate limit before API call
    incrementRateLimit(scope);

    // Call SerpAPI
    console.log(`SerpAPI call: ${endpoint} - "${query}" (scope: ${scope})`);
    const rawData = await callSerpAPI(SERPAPI_KEY, endpoint, query, options);

    // Normalize results based on endpoint
    let normalizedData;
    switch (endpoint) {
      case "images":
        normalizedData = normalizeImageResults(rawData);
        break;
      case "places":
        normalizedData = normalizePlacesResults(rawData);
        break;
      case "shopping":
        normalizedData = normalizeShoppingResults(rawData);
        break;
      default:
        normalizedData = normalizeSearchResults(rawData);
    }

    // Cache results
    cache.set(cacheKey, {
      data: normalizedData,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    // Log usage
    try {
      await supabase.from("ai_usage_log").insert({
        provider_name: "serpapi",
        model_id: endpoint,
        function_type: scope,
        success: true,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      });
    } catch (e) {
      console.log("Failed to log SerpAPI usage:", e);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: normalizedData, 
        cached: false,
        scope,
        remaining: rateCheck.remaining - 1,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("SerpAPI Gateway error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "SerpAPI request failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
