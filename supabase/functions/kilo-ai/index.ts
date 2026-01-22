import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/auth.ts";

// ==========================================
// MULTI-PROVIDER AI ENGINE WITH FALLBACK
// ==========================================

// Provider configurations
const PROVIDERS = {
  "1min.ai": {
    baseUrl: "https://api.1min.ai/api/features",
    authHeader: "API-KEY",
    authType: "api-key",
    secretKey: "ONEMIN_AI_API_KEY",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    authHeader: "Authorization",
    authType: "bearer",
    secretKey: "OPENROUTER_API_KEY",
    extraHeaders: {
      "HTTP-Referer": "https://wonderfuldragonfruit.co.za",
      "X-Title": "Dragon Fruit SA Admin",
    },
  },
  deepinfra: {
    baseUrl: "https://api.deepinfra.com/v1/openai/chat/completions",
    authHeader: "Authorization",
    authType: "bearer",
    secretKey: "DEEPINFRA_API_KEY",
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    authHeader: "Authorization",
    authType: "bearer",
    secretKey: "GROQ_API_KEY",
  },
};

// Default models per function type with provider
const DEFAULT_MODELS: Record<string, { provider: string; model: string }> = {
  chat: { provider: "1min.ai", model: "gpt-4o-mini" },
  coding: { provider: "openrouter", model: "deepseek/deepseek-coder:free" },
  reasoning: { provider: "openrouter", model: "deepseek/deepseek-r1:free" },
  agent: { provider: "openrouter", model: "google/gemini-flash-1.5:free" },
  fast: { provider: "openrouter", model: "google/gemini-flash-1.5:free" },
  audit: { provider: "openrouter", model: "deepseek/deepseek-r1:free" },
  seo: { provider: "openrouter", model: "google/gemini-flash-1.5:free" },
  content: { provider: "1min.ai", model: "gpt-4o-mini" },
  vision: { provider: "1min.ai", model: "gpt-4o" },
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
  provider?: string;
  model?: string;
  stream?: boolean;
}

// Get model config from database
async function getModelConfig(supabase: any, configKey: string): Promise<{ provider: string; model: string }> {
  try {
    const { data, error } = await supabase
      .from("ai_model_config")
      .select("provider, model_id, is_active")
      .eq("function_type", configKey)
      .single();

    if (error || !data || !data.is_active) {
      return DEFAULT_MODELS[configKey] || DEFAULT_MODELS.fast;
    }

    return { provider: data.provider, model: data.model_id };
  } catch {
    return DEFAULT_MODELS[configKey] || DEFAULT_MODELS.fast;
  }
}

// Get provider priority list
async function getProviderPriority(supabase: any): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("ai_provider_config")
      .select("provider_name")
      .eq("is_active", true)
      .order("priority", { ascending: true });

    if (error || !data?.length) {
      return ["1min.ai", "openrouter"];
    }

    return data.map((p: any) => p.provider_name);
  } catch {
    return ["1min.ai", "openrouter"];
  }
}

// Log usage
async function logUsage(
  supabase: any,
  provider: string,
  model: string,
  functionType: string,
  usage: any,
  success: boolean,
  errorMessage: string | null,
  responseTime: number
) {
  try {
    await supabase.from("ai_usage_log").insert({
      provider_name: provider,
      model_id: model,
      function_type: functionType,
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

// Call 1min.AI
async function call1minAI(apiKey: string, model: string, messages: any[]): Promise<any> {
  const response = await fetch("https://api.1min.ai/api/features", {
    method: "POST",
    headers: {
      "API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "CHAT_WITH_AI",
      model,
      promptObject: {
        prompt: messages.map(m => `${m.role}: ${m.content}`).join("\n"),
        isMixed: false,
        webSearch: false,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`1min.AI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.aiRecord?.aiRecordDetail?.resultText || data.result || "",
    usage: {
      prompt_tokens: data.usage?.inputTokens || 0,
      completion_tokens: data.usage?.outputTokens || 0,
      total_tokens: (data.usage?.inputTokens || 0) + (data.usage?.outputTokens || 0),
    },
  };
}

// Call OpenRouter-compatible APIs
async function callOpenRouter(apiKey: string, model: string, messages: any[], stream: boolean = false): Promise<any> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://wonderfuldragonfruit.co.za",
      "X-Title": "Dragon Fruit SA Admin",
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error: ${response.status} - ${errorText}`);
  }

  if (stream) {
    return { stream: response.body };
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    usage: data.usage,
  };
}

// Build system prompt
function buildSystemPrompt(type: string): string {
  const prompts: Record<string, string> = {
    product_description: `You are an expert e-commerce copywriter specializing in dragon fruit and agricultural products. 
Create compelling, SEO-optimized product descriptions that:
- Highlight the unique qualities and growing characteristics
- Use sensory language to describe the fruit's appearance and taste
- Include relevant keywords naturally
- Create urgency and desire
- Keep descriptions between 150-300 words
- Format with short paragraphs for readability`,

    seo_meta: `You are an SEO specialist for Dragon Fruit Farming Africa. Generate optimized meta tags following best practices:
- Title: Under 60 characters, include main keyword
- Description: Under 160 characters, compelling call-to-action
- Keywords: 5-10 relevant terms
Return as JSON: { "title": "", "description": "", "keywords": [] }`,

    content: `You are a content marketing specialist for Dragon Fruit Farming Africa. 
Create engaging content that:
- Celebrates dragon fruit cultivation and South African farming
- Is SEO-friendly and well-structured
- Uses proper heading hierarchy (H2, H3, etc.)
- Includes relevant internal linking suggestions
- Maintains a professional, helpful brand voice`,

    code_review: `You are a senior software engineer specializing in code review, security auditing, and performance optimization.
Analyze the provided code for:
- Security vulnerabilities (SQL injection, XSS, CSRF, etc.)
- Performance bottlenecks
- Best practices violations
- Bug potential
- Authentication/authorization issues
Provide actionable feedback with specific line references and severity levels.`,

    audit: `You are a senior fullstack security engineer conducting a comprehensive code audit.

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

Be thorough and specific. Reference actual code patterns and provide concrete fixes.`,

    chat: `You are DFSA Assistant, the friendly AI helper for Dragon Fruit Farming Africa (DFSA) - South Africa's premier dragon fruit nursery since 2008.

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

Be helpful, warm, and professional. Use emojis occasionally to be friendly 🌿 🐉`,

    custom: `You are a helpful AI assistant for the Dragon Fruit Farming Africa admin panel. 
You can help with:
- Product descriptions and content
- SEO optimization
- Marketing copy
- Customer communication
- Data analysis and insights
- Code review and debugging
Be helpful, professional, and knowledgeable about dragon fruit farming.`,
  };

  return prompts[type] || prompts.custom;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const requestData: AIRequest = await req.json();
    const { type, prompt, messages, context, provider: requestedProvider, model: requestedModel, stream = false } = requestData;

    // Get the config key for this request type
    const configKey = TYPE_TO_CONFIG[type] || "fast";

    // Get provider priority list for fallback
    const providerPriority = await getProviderPriority(supabase);

    // Determine provider and model
    let selectedProvider = requestedProvider;
    let selectedModel = requestedModel;

    if (!selectedProvider || !selectedModel) {
      const config = await getModelConfig(supabase, configKey);
      selectedProvider = selectedProvider || config.provider;
      selectedModel = selectedModel || config.model;
    }

    console.log(`AI Request - Type: ${type}, Provider: ${selectedProvider}, Model: ${selectedModel}`);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(type);
    let userPrompt = prompt || "";

    if (type === "product_description" && context?.productName) {
      userPrompt = `Create a compelling product description for "${context.productName}"${context.category ? ` in the ${context.category} category` : ""}.
${context.keywords?.length ? `Include these keywords naturally: ${context.keywords.join(", ")}` : ""}
${context.existingDescription ? `Improve upon this existing description: ${context.existingDescription}` : ""}
Additional context: ${prompt}`;
    }

    // Build messages array
    let finalMessages: Array<{ role: string; content: string }>;
    if (messages && messages.length > 0) {
      finalMessages = [{ role: "system", content: systemPrompt }, ...messages];
    } else {
      finalMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];
    }

    // Try providers in priority order with fallback
    let lastError: Error | null = null;
    let result: any = null;

    // Create ordered list: requested provider first, then fallbacks
    const providersToTry = selectedProvider
      ? [selectedProvider, ...providerPriority.filter(p => p !== selectedProvider)]
      : providerPriority;

    for (const provider of providersToTry) {
      try {
        const providerConfig = PROVIDERS[provider as keyof typeof PROVIDERS];
        if (!providerConfig) continue;

        const apiKey = Deno.env.get(providerConfig.secretKey);
        if (!apiKey) {
          console.log(`Skipping ${provider}: No API key configured`);
          continue;
        }

        console.log(`Trying provider: ${provider}`);

        // Determine model for this provider
        let modelToUse = selectedModel;
        if (provider !== selectedProvider) {
          // Use default model for fallback provider
          const defaultConfig = DEFAULT_MODELS[configKey] || DEFAULT_MODELS.fast;
          if (defaultConfig.provider === provider) {
            modelToUse = defaultConfig.model;
          } else if (provider === "openrouter") {
            modelToUse = "google/gemini-flash-1.5:free";
          } else if (provider === "1min.ai") {
            modelToUse = "gpt-4o-mini";
          }
        }

        if (provider === "1min.ai") {
          result = await call1minAI(apiKey, modelToUse, finalMessages);
        } else {
          result = await callOpenRouter(apiKey, modelToUse, finalMessages, stream);
        }

        // Log successful usage
        const responseTime = Date.now() - startTime;
        await logUsage(supabase, provider, modelToUse, type, result.usage, true, null, responseTime);

        // Handle streaming response
        if (stream && result.stream) {
          return new Response(result.stream, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            content: result.content,
            type,
            provider,
            model: modelToUse,
            usage: result.usage,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      } catch (err: any) {
        console.error(`Provider ${provider} failed:`, err.message);
        lastError = err;

        // Log failed attempt
        const responseTime = Date.now() - startTime;
        await logUsage(supabase, provider, selectedModel, type, null, false, err.message, responseTime);

        // Handle specific error codes
        if (err.message.includes("429")) {
          continue; // Rate limited, try next provider
        }
        if (err.message.includes("401") || err.message.includes("403")) {
          continue; // Auth error, try next provider
        }

        continue; // Try next provider
      }
    }

    // All providers failed
    throw lastError || new Error("All AI providers failed");

  } catch (error: any) {
    console.error("AI error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred",
        fix: "Check API keys and provider configuration in Admin → AI Providers",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});