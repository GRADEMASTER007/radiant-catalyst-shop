import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAdminAuth, corsHeaders, forbiddenResponse, unauthorizedResponse } from "../_shared/auth.ts";

// ==========================================
// Z.AI SEO GENERATOR - Admin only
// Generates SEO metadata for pages/blogs/products
// ==========================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await validateAdminAuth(req);
  if (auth.error) {
    return auth.error === "Admin access required" ? forbiddenResponse(auth.error) : unauthorizedResponse(auth.error);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { content, pageType, pageId, url } = await req.json();

    if (!content?.trim()) {
      return new Response(JSON.stringify({ error: "Content is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Analyze this content and generate comprehensive SEO metadata:

Content: "${content.substring(0, 2000)}"
${url ? `URL: ${url}` : ""}
${pageType ? `Type: ${pageType}` : ""}

Return as JSON:
{
  "meta_title": "Under 60 chars with primary keyword",
  "meta_description": "Under 160 chars, compelling with CTA",
  "keywords": ["keyword1", "keyword2", ...],
  "og_title": "Open Graph title",
  "og_description": "Open Graph description",
  "suggestions": ["SEO improvement suggestion 1", "SEO improvement suggestion 2"]
}`;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-orchestrator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ type: "seo_optimization", prompt }),
    });

    if (!response.ok) throw new Error(`Orchestrator error: ${response.status}`);

    const data = await response.json();
    let seoData: any = {};

    try {
      // Try to parse JSON from response
      const jsonMatch = data.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        seoData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      seoData = {
        meta_title: data.content.substring(0, 60),
        meta_description: data.content.substring(0, 160),
        keywords: [],
        suggestions: [],
      };
    }

    // Save to seo_metadata table
    if (pageId) {
      await supabase.from("seo_metadata").upsert({
        page_type: pageType || "page",
        page_id: pageId,
        meta_title: seoData.meta_title,
        meta_description: seoData.meta_description,
        keywords: seoData.keywords || [],
        og_title: seoData.og_title,
        og_description: seoData.og_description,
        suggestions: seoData.suggestions || [],
        generated_by: "z.ai",
        updated_at: new Date().toISOString(),
      }, { onConflict: "page_id" }).select();
    }

    return new Response(
      JSON.stringify({
        success: true,
        seo: seoData,
        model: data.model,
        provider: "z.ai",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[zai-seo] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "SEO generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
