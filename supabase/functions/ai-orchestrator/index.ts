import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/auth.ts";

// ==========================================
// ALIBABA MODEL STUDIO (DASHSCOPE) ORCHESTRATOR
// Plan: Coding Plan (OpenAI-compatible)
// Base URL: https://coding-intl.dashscope.aliyuncs.com/v1
// Endpoint: /chat/completions
// ==========================================

const ALIBABA_BASE_URL = "https://coding-intl.dashscope.aliyuncs.com/v1/chat/completions";

// Models supported by your Coding Plan (examples)
// Primary + fallback (keep as you prefer)
const DEFAULT_MODEL = "qwen3.5-plus";
const FALLBACK_MODEL = "qwen3-max-2026-01-23";

const SYSTEM_PROMPTS: Record<string, string> = {
  customer_chat: `You are the AI assistant for this website. You help customers find products, answer questions about dragon fruit cultivation, probiotics, and farming. You are knowledgeable, warm, and professional. Contact: +27 83 447 4639 | Email: admin@proagrisa.co.za`,

  admin_ai_assistant: `You are the AI assistant for this website. You help generate blog posts, pages, SEO content, and assist with admin tasks. You understand the structure of the website and always produce high-quality, professional, SEO-optimized content tailored to the business.`,

  ai_control_panel: `You are a helpful AI assistant. Respond concisely and accurately.`,

  content_generation: `You are a content marketing specialist. Create engaging, SEO-friendly content. Always produce high-quality, professional content tailored to the business.`,

  seo_optimization: `You are an SEO specialist. Generate optimized meta tags:
- Title: Under 60 chars with main keyword
- Description: Under 160 chars, compelling CTA
- Keywords: 5-10 relevant terms
Return as JSON: { "title": "", "description": "", "keywords": [] }`,

  blog_generation: `You are a professional blog writer. Create well-structured, SEO-optimized blog posts with:
- Engaging title
- Introduction
- Multiple sections with headers
- Conclusion with CTA
- Meta description
Format with markdown headers.`,

  page_generation: `You are a web page content generator. Create structured content with:
- Hero section text
- Multiple content sections
- Clear headings and subheadings
- Calls to action
Format with markdown.`,

  image_generation: `You are an expert at crafting image generation prompts. Create detailed, vivid prompts for AI image generators.`,

  code_generation: `You are an expert software engineer. Generate clean, efficient, well-documented code.`,
  code_fixing: `You are a senior software engineer specializing in debugging and code optimization.`,
  security_audit: `You are a senior security engineer. Analyze code for vulnerabilities.`,
  vision_documents: `You are an AI that analyzes images and documents.`,
  page_builder: `You are a web page content generator. Create structured content for website pages.`,
  menu_builder: `You are a navigation/menu structure expert.`,
  agentic_tasks: `You are an autonomous agent capable of planning and executing multi-step tasks.`,
};

interface AIRequest {
  type: string;
  prompt?: string;
  messages?: Array<{ role: string; content: string }>;
  context?: Record<string, any>;
  stream?: boolean;
}

// Log usage to database
async function logUsage(
  supabase: any,
  model: string,
  scopeType: string,
  userId: string | null,
  usage: any,
  success: boolean,
  errorMessage: string | null,
  responseTime: number
) {
  try {
    await supabase.from("ai_usage_log").insert({
      provider_name: "alibaba",
      model_id: model,
      function_type: scopeType,
      user_id: userId,
      prompt_tokens: usage?.prompt_tokens || 0,
      completion_tokens: usage?.completion_tokens || 0,
      total_tokens: usage?.total_tokens || 0,
      success,
      error_message: errorMessage,
      response_time_ms: responseTime,
    });
  } catch (e) {
    console.error("Failed to log usage:", e);
  }
}

// Call Alibaba (DashScope) OpenAI-compatible API
async function callAlibaba(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  stream: boolean = false
): Promise<{ content: string; usage: any; stream?: ReadableStream }> {
  console.log(`[alibaba] Calling model=${model}, stream=${stream}, messages=${messages.length}`);
  console.log(`[alibaba] URL: ${ALIBABA_BASE_URL}`);
  console.log(`[alibaba] API Key prefix: ${apiKey?.substring(0, 8)}...`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(ALIBABA_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
        temperature: 0.7,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    console.log(`[alibaba] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[alibaba] Error response: ${errorText}`);
      throw new Error(`Alibaba error (${response.status}): ${errorText}`);
    }

    if (stream && response.body) {
      return { content: "", usage: null, stream: response.body };
    }

    const data = await response.json();
    console.log(`[alibaba] Success, tokens: ${data.usage?.total_tokens || "unknown"}`);

    return {
      content: data.choices?.[0]?.message?.content || "",
      usage: data.usage || {},
    };
  } catch (e: any) {
    clearTimeout(timeout);
    if (e.name === "AbortError") {
      console.error(`[alibaba] Request timed out after 30s`);
      throw new Error("Alibaba request timed out after 30 seconds");
    }
    throw e;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ALIBABA_API_KEY = Deno.env.get("ALIBABA_API_KEY");

    if (!ALIBABA_API_KEY) {
      throw new Error("ALIBABA_API_KEY is not configured. Add it to your Supabase Edge Function secrets.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Try to get user ID
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ") && authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabase.auth.getUser(token);
        userId = data.user?.id || null;
      } catch {
        // ignore
      }
    }

    const { type, prompt, messages, stream = false }: AIRequest = await req.json();

    const scopeType = type || "ai_control_panel";
    const systemPrompt = SYSTEM_PROMPTS[scopeType] || SYSTEM_PROMPTS.ai_control_panel;

    // Build messages
    let finalMessages: Array<{ role: string; content: string }>;
    if (messages?.length) {
      const hasSystem = messages.some((m) => m.role === "system");
      finalMessages = hasSystem ? messages : [{ role: "system", content: systemPrompt }, ...messages];
    } else {
      finalMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt || "Hello" },
      ];
    }

    // Try primary model, fallback if needed
    let model = DEFAULT_MODEL;
    let result: any;

    try {
      result = await callAlibaba(ALIBABA_API_KEY, model, finalMessages, stream);
    } catch (primaryError: any) {
      console.error(`[alibaba] Primary model ${model} failed:`, primaryError.message);

      model = FALLBACK_MODEL;
      try {
        result = await callAlibaba(ALIBABA_API_KEY, model, finalMessages, stream);
      } catch (fallbackError: any) {
        console.error(`[alibaba] Fallback model ${model} failed:`, fallbackError.message);
        throw fallbackError;
      }
    }

    const responseTime = Date.now() - startTime;
    await logUsage(supabase, model, scopeType, userId, result.usage, true, null, responseTime);

    // Handle streaming
    if (stream && result.stream) {
      return new Response(result.stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: result.content,
        type: scopeType,
        provider: "alibaba",
        model,
        usage: result.usage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[alibaba Orchestrator Error]", error);

    const statusCode = error.message?.includes("429") ? 429
      : error.message?.includes("402") ? 402
      : 500;

    return new Response(
      JSON.stringify({
        error: error.message || "AI service unavailable",
        provider: "alibaba",
      }),
      { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
