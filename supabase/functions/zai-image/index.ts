import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAdminAuth, corsHeaders, forbiddenResponse, unauthorizedResponse } from "../_shared/auth.ts";

// ==========================================
// Z.AI IMAGE GENERATOR - Admin only
// Generates image prompts and manages image generation
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

    const { type, prompt, imageUrl, context } = await req.json();

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let aiPrompt = prompt;

    if (type === "generate_prompt" && context?.productName) {
      aiPrompt = `Create a detailed image generation prompt for: ${context.productName}
${context.category ? `Category: ${context.category}` : ""}
${context.style ? `Style: ${context.style}` : "African artisan, handcrafted aesthetic"}
Additional: ${prompt}

Return ONLY the image prompt, nothing else.`;
    } else if (type === "analyze" && imageUrl) {
      aiPrompt = `Analyze this image in detail: ${imageUrl}\n${prompt}`;
    } else if (type === "describe") {
      aiPrompt = `Create SEO-optimized alt text for this product image: ${imageUrl}`;
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-orchestrator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ type: "image_generation", prompt: aiPrompt }),
    });

    if (!response.ok) throw new Error(`Orchestrator error: ${response.status}`);

    const data = await response.json();

    // Save to generated_images table
    const userId = auth.user?.id;
    await supabase.from("generated_images").insert({
      prompt: prompt,
      model: data.model || "GLM-4.7",
      status: "completed",
      metadata: { type, context, response: data.content?.substring(0, 500) },
      created_by: userId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        content: data.content,
        type,
        model: data.model,
        provider: "z.ai",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[zai-image] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Image generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
