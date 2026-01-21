import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAdminAuth, corsHeaders, forbiddenResponse, unauthorizedResponse } from "../_shared/auth.ts";

// Default models - used as fallback if DB config not found
const DEFAULT_MODELS: Record<string, string> = {
  chat: "meta-llama/llama-3.3-70b-instruct:free",
  coding: "meta-llama/llama-3.3-70b-instruct:free",
  reasoning: "meta-llama/llama-3.3-70b-instruct:free",
  agent: "meta-llama/llama-3.3-70b-instruct:free",
  fast: "meta-llama/llama-3.3-70b-instruct:free",
  audit: "meta-llama/llama-3.3-70b-instruct:free",
  seo: "meta-llama/llama-3.3-70b-instruct:free",
  content: "meta-llama/llama-3.3-70b-instruct:free",
  vision: "meta-llama/llama-3.3-70b-instruct:free",
};

// Type to config key mapping
const TYPE_TO_CONFIG: Record<string, string> = {
  product_description: "content",
  seo_meta: "seo",
  content: "content",
  code_review: "coding",
  chat: "chat",
  audit: "audit",
  custom: "fast",
};

// OpenRouter API endpoint
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface AIRequest {
  type: "product_description" | "seo_meta" | "content" | "custom" | "code_review" | "chat" | "audit";
  prompt: string;
  messages?: Array<{ role: string; content: string }>;
  context?: {
    productName?: string;
    category?: string;
    keywords?: string[];
    existingDescription?: string;
  };
  model?: string; // Allow override
  stream?: boolean;
}

async function getModelFromConfig(supabase: any, configKey: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("ai_model_config")
      .select("model_id, is_active")
      .eq("function_type", configKey)
      .single();

    if (error || !data || !data.is_active) {
      console.log(`Using default model for ${configKey}`);
      return DEFAULT_MODELS[configKey] || DEFAULT_MODELS.fast;
    }

    return data.model_id;
  } catch (e) {
    console.error("Error fetching model config:", e);
    return DEFAULT_MODELS[configKey] || DEFAULT_MODELS.fast;
  }
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
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured. Please add your OpenRouter API key.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const requestData: AIRequest = await req.json();
    const { type, prompt, messages, context, model: requestedModel, stream = false } = requestData;

    // Get the config key for this request type
    const configKey = TYPE_TO_CONFIG[type] || "fast";
    
    // Use requested model if provided, otherwise fetch from config
    const selectedModel = requestedModel || await getModelFromConfig(supabase, configKey);

    let systemPrompt = "";
    let userPrompt = prompt || "";

    switch (type) {
      case "product_description":
        systemPrompt = `You are an expert e-commerce copywriter specializing in dragon fruit and agricultural products. 
Create compelling, SEO-optimized product descriptions that:
- Highlight the unique qualities and growing characteristics
- Use sensory language to describe the fruit's appearance and taste
- Include relevant keywords naturally
- Create urgency and desire
- Keep descriptions between 150-300 words
- Format with short paragraphs for readability`;
        
        if (context?.productName) {
          userPrompt = `Create a compelling product description for "${context.productName}"${context.category ? ` in the ${context.category} category` : ""}.
${context.keywords?.length ? `Include these keywords naturally: ${context.keywords.join(", ")}` : ""}
${context.existingDescription ? `Improve upon this existing description: ${context.existingDescription}` : ""}
Additional context: ${prompt}`;
        }
        break;

      case "seo_meta":
        systemPrompt = `You are an SEO specialist for Dragon Fruit Farming Africa. Generate optimized meta tags following best practices:
- Title: Under 60 characters, include main keyword
- Description: Under 160 characters, compelling call-to-action
- Keywords: 5-10 relevant terms
Return as JSON: { "title": "", "description": "", "keywords": [] }`;
        break;

      case "content":
        systemPrompt = `You are a content marketing specialist for Dragon Fruit Farming Africa. 
Create engaging content that:
- Celebrates dragon fruit cultivation and South African farming
- Is SEO-friendly and well-structured
- Uses proper heading hierarchy (H2, H3, etc.)
- Includes relevant internal linking suggestions
- Maintains a professional, helpful brand voice`;
        break;

      case "code_review":
        systemPrompt = `You are a senior software engineer specializing in code review, security auditing, and performance optimization.
Analyze the provided code for:
- Security vulnerabilities (SQL injection, XSS, CSRF, etc.)
- Performance bottlenecks
- Best practices violations
- Bug potential
- Authentication/authorization issues
Provide actionable feedback with specific line references and severity levels.`;
        break;

      case "audit":
        systemPrompt = `You are a senior fullstack security engineer conducting a comprehensive code audit.

FORMAT YOUR RESPONSE WITH CLEAR SEVERITY MARKERS:
- Start each finding with **CRITICAL:**, **HIGH:**, **MEDIUM:**, **LOW:**, or **INFO:**
- Include the category (SECURITY, PERFORMANCE, RELIABILITY, PAYMENT, DATABASE)
- Provide specific file/function references
- Give actionable remediation steps

ANALYZE THESE AREAS:
1. SECURITY: Authentication bypass, authorization flaws, input validation, SQL injection, XSS, CSRF
2. PAYMENT INTEGRATION: Signature verification, amount validation, webhook security, idempotency, race conditions
3. DATABASE: RLS policy gaps, data exposure, foreign key validation
4. API SECURITY: Input sanitization, rate limiting, error disclosure
5. CONFIGURATION: Secrets exposure, CORS issues, environment variables

Be thorough and specific. Reference actual code patterns and provide concrete fixes.`;
        break;

      case "chat":
        systemPrompt = `You are DFSA Assistant, the friendly AI helper for Dragon Fruit Farming Africa (DFSA) - South Africa's premier dragon fruit nursery since 2008.

## Your Role:
- Help customers find the perfect dragon fruit cultivars for their needs
- Collect customer details for inquiries and orders
- Provide information about our services: consultations, rooting service, business plans, and funding assistance
- Make personalized product recommendations based on customer goals

## Key Information:
- We sell UNROOTED CUTTINGS (not rooted plants)
- Professional rooting service available - contact for pricing
- We export worldwide: South Africa, Botswana, Zambia, Zimbabwe, Uganda, Namibia, Malawi, and more
- Contact: Reception +1 351 777 2848 | After-hours: 083 447 4639 | WhatsApp: +27 83 447 4639

Be helpful, warm, and professional. Use emojis occasionally to be friendly 🌿 🐉`;
        break;

      case "custom":
      default:
        systemPrompt = `You are a helpful AI assistant for the Dragon Fruit Farming Africa admin panel. 
You can help with:
- Product descriptions and content
- SEO optimization
- Marketing copy
- Customer communication
- Data analysis and insights
- Code review and debugging
Be helpful, professional, and knowledgeable about dragon fruit farming.`;
        break;
    }

    // Build messages array
    let finalMessages: Array<{ role: string; content: string }>;
    
    if (messages && messages.length > 0) {
      finalMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
      ];
    } else {
      finalMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];
    }

    console.log(`Using model: ${selectedModel} for type: ${type} (config: ${configKey})`);

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://dragonfruitsa.lovable.app",
        "X-Title": "Dragon Fruit SA Admin",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: finalMessages,
        stream,
        temperature: type === "code_review" || type === "audit" ? 0.1 : 0.7,
        max_tokens: type === "audit" ? 4096 : 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please check your OpenRouter account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid API key. Please check your OPENROUTER_API_KEY configuration." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    // Handle streaming response
    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ 
        success: true, 
        content, 
        type,
        model: selectedModel,
        usage: data.usage 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
