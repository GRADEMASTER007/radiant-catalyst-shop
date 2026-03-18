import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAdminAuth, corsHeaders, forbiddenResponse, unauthorizedResponse } from "../_shared/auth.ts";

// ==========================================
// Z.AI PAGE GENERATOR - Admin only
// Generates pages and auto-saves to DB
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

    const { prompt, template } = await req.json();

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fullPrompt = `Create a professional website page about: "${prompt}"

Return in this format:
TITLE: [Page title]
META_DESCRIPTION: [SEO description under 160 chars]
---
[Full page content in markdown with ## sections, paragraphs, bullet points, and CTAs]`;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-orchestrator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ type: "page_generation", prompt: fullPrompt }),
    });

    if (!response.ok) throw new Error(`Orchestrator error: ${response.status}`);

    const data = await response.json();
    const aiContent = data.content || "";

    let title = prompt;
    let metaDescription = "";
    let pageContent = aiContent;

    for (const line of aiContent.split("\n")) {
      if (line.startsWith("TITLE:")) title = line.replace("TITLE:", "").trim();
      if (line.startsWith("META_DESCRIPTION:")) metaDescription = line.replace("META_DESCRIPTION:", "").trim();
    }

    const sepIdx = aiContent.indexOf("---");
    if (sepIdx !== -1) pageContent = aiContent.slice(sepIdx + 3).trim();

    const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").substring(0, 100);

    // Save to pages table
    const { data: page, error } = await supabase
      .from("pages")
      .insert({
        title,
        slug,
        content: pageContent,
        is_published: true,
        template: template || "default",
        meta_title: title,
        meta_description: metaDescription,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto SEO metadata
    await supabase.from("seo_metadata").insert({
      page_type: "page",
      page_id: page.id,
      meta_title: title,
      meta_description: metaDescription,
      generated_by: "z.ai",
    });

    // Add to header menu
    try {
      const { data: menus } = await supabase
        .from("menus")
        .select("*")
        .eq("location", "header")
        .single();

      if (menus) {
        const items = Array.isArray(menus.items) ? menus.items : [];
        if (!items.some((item: any) => item.url === `/page/${slug}`)) {
          items.push({ label: title, url: `/page/${slug}`, order: items.length });
          await supabase.from("menus").update({ items }).eq("id", menus.id);
        }
      }
    } catch {}

    return new Response(
      JSON.stringify({
        success: true,
        title,
        content: pageContent,
        meta_description: metaDescription,
        slug,
        page_id: page.id,
        view_url: `/page/${slug}`,
        model: data.model,
        provider: "z.ai",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[zai-page] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Page generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
