import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAdminAuth, corsHeaders, forbiddenResponse, unauthorizedResponse } from "../_shared/auth.ts";

interface SerpApiResponse {
  organic_results?: Array<{
    title: string;
    snippet: string;
    link: string;
  }>;
  related_searches?: Array<{
    query: string;
  }>;
  related_questions?: Array<{
    question: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin-only endpoint - require admin authentication
  const auth = await validateAdminAuth(req);
  if (auth.error) {
    if (auth.error === "Admin access required") {
      return forbiddenResponse(auth.error);
    }
    return unauthorizedResponse(auth.error);
  }

  try {
    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!SERPAPI_KEY) {
      throw new Error("SERPAPI_KEY not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, productId, productIds, keyword } = await req.json();

    // Action: Get keyword research for a specific keyword
    if (action === "research") {
      const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(keyword)}&api_key=${SERPAPI_KEY}&num=10`;
      const response = await fetch(searchUrl);
      const data: SerpApiResponse = await response.json();

      const relatedKeywords = data.related_searches?.map(r => r.query) || [];
      const questions = data.related_questions?.map(r => r.question) || [];
      const competitorTitles = data.organic_results?.map(r => r.title) || [];
      const competitorSnippets = data.organic_results?.map(r => r.snippet) || [];

      return new Response(JSON.stringify({
        relatedKeywords,
        questions,
        competitorTitles,
        competitorSnippets,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: Optimize a single product
    if (action === "optimize-product" && productId) {
      const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error || !product) {
        throw new Error("Product not found");
      }

      // Search for related keywords based on product name
      const searchQuery = `${product.name} dragon fruit plant buy`;
      const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(searchQuery)}&api_key=${SERPAPI_KEY}&num=5&gl=za`;
      const response = await fetch(searchUrl);
      const data: SerpApiResponse = await response.json();

      const relatedKeywords = data.related_searches?.slice(0, 5).map(r => r.query) || [];
      
      // Generate optimized meta title (under 60 chars)
      const baseTitle = product.name;
      const metaTitle = `${baseTitle} Dragon Fruit Cutting | DFSA`.slice(0, 60);
      
      // Generate optimized meta description (under 160 chars)
      const priceText = `R${product.price_zar}`;
      const shortDesc = product.short_description || `Premium ${product.name} dragon fruit cutting`;
      const metaDescription = `${shortDesc}. ${priceText}. Professional rooting service available. Buy from DFSA Healthy Fields.`.slice(0, 160);

      // Build tags from related keywords
      const existingTags = product.tags || [];
      const newTags = [
        ...new Set([
          ...existingTags,
          "dragon fruit",
          "pitaya",
          product.name.toLowerCase(),
          "dragon fruit cutting",
          "dfsa",
          ...relatedKeywords.slice(0, 3).map(k => k.toLowerCase().replace(/buy|online|price/gi, "").trim()),
        ]),
      ].filter(Boolean).slice(0, 10);

      // Update product with optimized SEO
      const { error: updateError } = await supabase
        .from("products")
        .update({
          meta_title: metaTitle,
          meta_description: metaDescription,
          tags: newTags,
        })
        .eq("id", productId);

      if (updateError) {
        throw updateError;
      }

      return new Response(JSON.stringify({
        success: true,
        productId,
        optimized: {
          meta_title: metaTitle,
          meta_description: metaDescription,
          tags: newTags,
          relatedKeywords,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: Bulk optimize multiple products
    if (action === "bulk-optimize" && productIds) {
      const results = [];
      
      for (const id of productIds) {
        try {
          const { data: product } = await supabase
            .from("products")
            .select("*")
            .eq("id", id)
            .single();

          if (!product) continue;

          // Generate optimized meta
          const metaTitle = `${product.name} Dragon Fruit Cutting | DFSA`.slice(0, 60);
          const priceText = `R${product.price_zar}`;
          const shortDesc = product.short_description || `Premium ${product.name} dragon fruit cutting`;
          const metaDescription = `${shortDesc}. ${priceText}. Professional rooting service available. Buy from DFSA.`.slice(0, 160);

          const existingTags = product.tags || [];
          const newTags = [
            ...new Set([
              ...existingTags,
              "dragon fruit",
              "pitaya",
              product.name.toLowerCase(),
              "dragon fruit cutting",
              "dfsa",
            ]),
          ].filter(Boolean).slice(0, 10);

          await supabase
            .from("products")
            .update({
              meta_title: metaTitle,
              meta_description: metaDescription,
              tags: newTags,
            })
            .eq("id", id);

          results.push({ id, success: true, meta_title: metaTitle });
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "Unknown error";
          results.push({ id, success: false, error: errorMessage });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: Get SEO audit for all products
    if (action === "audit") {
      const { data: products, error } = await supabase
        .from("products")
        .select("id, name, meta_title, meta_description, tags, short_description")
        .eq("is_active", true);

      if (error) throw error;

      const audit = products?.map(p => {
        const issues = [];
        
        if (!p.meta_title) issues.push("Missing meta title");
        else if (p.meta_title.length > 60) issues.push("Meta title too long");
        
        if (!p.meta_description) issues.push("Missing meta description");
        else if (p.meta_description.length > 160) issues.push("Meta description too long");
        
        if (!p.tags || p.tags.length === 0) issues.push("No tags");
        else if (p.tags.length < 3) issues.push("Too few tags");
        
        if (!p.short_description) issues.push("Missing short description");

        return {
          id: p.id,
          name: p.name,
          meta_title: p.meta_title,
          meta_title_length: p.meta_title?.length || 0,
          meta_description: p.meta_description,
          meta_description_length: p.meta_description?.length || 0,
          tags_count: p.tags?.length || 0,
          issues,
          score: Math.max(0, 100 - (issues.length * 20)),
        };
      });

      const avgScore = audit ? audit.reduce((acc, a) => acc + a.score, 0) / audit.length : 0;

      return new Response(JSON.stringify({
        products: audit,
        summary: {
          total: audit?.length || 0,
          avgScore: Math.round(avgScore),
          needsOptimization: audit?.filter(a => a.score < 80).length || 0,
          optimized: audit?.filter(a => a.score >= 80).length || 0,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("SEO Optimizer error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
