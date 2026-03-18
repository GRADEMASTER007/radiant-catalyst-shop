import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAdminAuth, corsHeaders, forbiddenResponse, unauthorizedResponse } from "../_shared/auth.ts";

// ==========================================
// Z.AI BLOG GENERATOR - Admin only
// Generates blog posts and auto-saves to DB
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

    const { topic, keywords, autoSave } = await req.json();

    if (!topic?.trim()) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Write a comprehensive, SEO-optimized blog post about: "${topic}"
${keywords?.length ? `Target keywords: ${keywords.join(", ")}` : ""}

Return the response in this exact format:
TITLE: [Your blog title here]
META_DESCRIPTION: [SEO meta description under 160 chars]
KEYWORDS: [comma-separated keywords]
---
[Full blog content in markdown format with ## headers, paragraphs, and bullet points]`;

    // Call orchestrator
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-orchestrator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        type: "blog_generation",
        prompt,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Orchestrator error: ${err}`);
    }

    const data = await response.json();
    const aiContent = data.content || "";

    // Parse structured output
    let title = topic;
    let metaDescription = "";
    let parsedKeywords: string[] = keywords || [];
    let blogContent = aiContent;

    const lines = aiContent.split("\n");
    for (const line of lines) {
      if (line.startsWith("TITLE:")) title = line.replace("TITLE:", "").trim();
      if (line.startsWith("META_DESCRIPTION:")) metaDescription = line.replace("META_DESCRIPTION:", "").trim();
      if (line.startsWith("KEYWORDS:")) parsedKeywords = line.replace("KEYWORDS:", "").trim().split(",").map((k: string) => k.trim());
    }

    const separatorIdx = aiContent.indexOf("---");
    if (separatorIdx !== -1) {
      blogContent = aiContent.slice(separatorIdx + 3).trim();
    }

    // Generate slug
    const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").substring(0, 100);
    const wordCount = blogContent.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    let savedPost = null;

    // Auto-save to database
    if (autoSave !== false) {
      const { data: post, error } = await supabase
        .from("blog_posts")
        .insert({
          title,
          slug,
          content: blogContent,
          excerpt: metaDescription || blogContent.substring(0, 250),
          is_published: false, // Draft by default
          author_name: "Z.AI",
          category: "general",
          read_time_minutes: readTime,
          meta_title: title,
          meta_description: metaDescription,
          tags: parsedKeywords,
        })
        .select()
        .single();

      if (error) console.error("Auto-save error:", error);
      else savedPost = post;

      // Auto-generate SEO metadata
      if (savedPost) {
        await supabase.from("seo_metadata").insert({
          page_type: "blog",
          page_id: savedPost.id,
          meta_title: title,
          meta_description: metaDescription,
          keywords: parsedKeywords,
          generated_by: "z.ai",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        title,
        content: blogContent,
        meta_description: metaDescription,
        keywords: parsedKeywords,
        read_time: readTime,
        slug,
        saved: !!savedPost,
        post_id: savedPost?.id,
        model: data.model,
        provider: "z.ai",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[zai-blog] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Blog generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
