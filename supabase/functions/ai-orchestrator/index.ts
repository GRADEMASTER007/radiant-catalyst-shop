import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/auth.ts";

// ==========================================
// MULTI-PROVIDER AI ORCHESTRATION ENGINE
// Architecture Layer 2: Central AI Gateway
// 
// This is the SINGLE entry point for all AI requests.
// Provider configs are read from database (ai_provider_config).
// Model assignments are read from database (ai_model_config).
// Feature pages should NOT hardcode providers or models.
//
// SUPPORTED PROVIDERS:
// - openrouter: OpenAI-compatible API
// - google_ai_studio: Gemini native API (NOT OpenAI compatible)
// - onemin: 1min.ai features/conversations API
// - groq: OpenAI-compatible API
// ==========================================

// Provider secret key mappings (NEVER exposed to client)
const PROVIDER_SECRET_KEYS: Record<string, string> = {
  perplexity: "PERPLEXITY_API_KEY",
  openai: "OPENAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  google_ai_studio: "GOOGLE_AI_API_KEY",
  onemin: "ONEMIN_AI_API_KEY",
  groq: "GROQ_API_KEY",
  deepinfra: "DEEPINFRA_API_KEY",
  together: "TOGETHER_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  mistral: "MISTRAL_API_KEY",
  huggingface: "HUGGINGFACE_TOKEN",
  // Legacy mappings
  "1min.ai": "ONEMIN_AI_API_KEY",
  google: "GOOGLE_AI_API_KEY",
};

interface ProviderConfig {
  baseUrl: string;
  streamUrl?: string;
  authHeader: string;
  authType: string;
  secretKey: string;
  extraHeaders?: Record<string, string>;
  apiFormat?: string;
  settings?: Record<string, any>;
}

// Static fallback configs (used only if database is unreachable)
const FALLBACK_PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  // PERPLEXITY - reliable fallback with working key
  perplexity: {
    baseUrl: "https://api.perplexity.ai/chat/completions",
    authHeader: "Authorization",
    authType: "bearer",
    secretKey: "PERPLEXITY_API_KEY",
    apiFormat: "openai_compatible",
  },
  // OPENAI - standard fallback
  openai: {
    baseUrl: "https://api.openai.com/v1/chat/completions",
    authHeader: "Authorization",
    authType: "bearer",
    secretKey: "OPENAI_API_KEY",
    apiFormat: "openai_compatible",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    authHeader: "Authorization",
    authType: "bearer",
    secretKey: "OPENROUTER_API_KEY",
    apiFormat: "openai_compatible",
    extraHeaders: {
      "HTTP-Referer": "https://africanvibe.co.za",
      "X-Title": "African Vibe",
    },
  },
  google_ai_studio: {
    baseUrl: "https://generativelanguage.googleapis.com/v1",
    authHeader: "x-goog-api-key",
    authType: "api-key",
    secretKey: "GOOGLE_AI_API_KEY",
    apiFormat: "gemini_native",
  },
  onemin: {
    baseUrl: "https://api.1min.ai",
    authHeader: "API-KEY",
    authType: "api-key",
    secretKey: "ONEMIN_AI_API_KEY",
    apiFormat: "onemin_features",
    settings: {
      featuresUrl: "https://api.1min.ai/api/features",
      conversationsUrl: "https://api.1min.ai/api/conversations",
    },
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    authHeader: "Authorization",
    authType: "bearer",
    secretKey: "GROQ_API_KEY",
    apiFormat: "openai_compatible",
  },
};

// Default models per scope - use 1min.ai as primary (has working API key)
const DEFAULT_MODELS: Record<string, { provider: string; model: string }> = {
  customer_chat: { provider: "onemin", model: "gpt-4o-mini" },
  admin_ai_assistant: { provider: "onemin", model: "gpt-4o-mini" },
  ai_control_panel: { provider: "onemin", model: "gpt-4o-mini" },
  code_generation: { provider: "onemin", model: "gpt-4o-mini" },
  code_fixing: { provider: "onemin", model: "gpt-4o-mini" },
  security_audit: { provider: "onemin", model: "gpt-4o-mini" },
  seo_optimization: { provider: "onemin", model: "gpt-4o-mini" },
  content_generation: { provider: "onemin", model: "gpt-4o-mini" },
  vision_documents: { provider: "onemin", model: "gpt-4o-mini" },
  image_prompt_generation: { provider: "onemin", model: "gpt-4o-mini" },
  page_builder: { provider: "onemin", model: "gpt-4o-mini" },
  menu_builder: { provider: "onemin", model: "gpt-4o-mini" },
  agentic_tasks: { provider: "onemin", model: "gpt-4o-mini" },
};

interface AIRequest {
  type: string;
  prompt: string;
  messages?: Array<{ role: string; content: string }>;
  context?: Record<string, any>;
  provider?: string;
  model?: string;
  stream?: boolean;
  testMode?: boolean;
  diagnosticAction?: "key_test" | "model_smoke_test" | "fetch_models";
}

interface DebugInfo {
  scope_used: string;
  provider_configured: string;
  provider_used: string;
  model_used: string;
  base_url_used: string;
  key_source_used: "vault" | "env";
  fallback_used: boolean;
  fallback_reason?: string;
}

// ==========================================
// SECRET KEY RESOLUTION
// Priority: 1) API Key Vault → 2) env → 3) Error
// ==========================================
async function resolveAPIKey(
  supabase: any,
  providerName: string,
  secretKeyName: string
): Promise<{ key: string; source: "vault" | "env" }> {
  // TIER 1: Try API Key Vault (database)
  try {
    const { data: vaultKey, error } = await supabase
      .from("api_keys_vault")
      .select("key_value, is_active")
      .eq("key_name", secretKeyName)
      .eq("is_active", true)
      .single();

    if (!error && vaultKey?.key_value) {
      console.log(`[Key Resolution] ${providerName}: Using API Key Vault (${secretKeyName})`);
      await supabase
        .from("api_keys_vault")
        .update({ last_used_at: new Date().toISOString() })
        .eq("key_name", secretKeyName);
      return { key: vaultKey.key_value, source: "vault" };
    }
  } catch (e) {
    console.log(`[Key Resolution] ${providerName}: Vault lookup failed`);
  }

  // TIER 2: Try environment variables
  const envKey = Deno.env.get(secretKeyName);
  if (envKey) {
    console.log(`[Key Resolution] ${providerName}: Using env (${secretKeyName})`);
    return { key: envKey, source: "env" };
  }

  // TIER 3: Error
  throw new Error(`API key not found: ${secretKeyName}. Add to API Vault or environment.`);
}

// Fetch provider config from database
async function getProviderConfig(supabase: any, providerName: string): Promise<ProviderConfig | null> {
  try {
    const { data, error } = await supabase
      .from("ai_provider_config")
      .select("base_url, auth_type, auth_header, settings, is_active")
      .eq("provider_name", providerName)
      .single();

    if (error || !data) {
      console.log(`[Config] Using fallback for ${providerName}`);
      return FALLBACK_PROVIDER_CONFIGS[providerName] || null;
    }

    if (!data.is_active) {
      console.log(`[Config] Provider ${providerName} is disabled`);
      return null;
    }

    const secretKey = data.settings?.secretKey || PROVIDER_SECRET_KEYS[providerName] || "OPENROUTER_API_KEY";

    return {
      baseUrl: data.base_url,
      authHeader: data.auth_header || "Authorization",
      authType: data.auth_type || "bearer",
      secretKey,
      apiFormat: data.settings?.apiFormat || "openai_compatible",
      settings: data.settings,
      extraHeaders: data.settings?.extraHeaders,
    };
  } catch (e) {
    console.error(`[Config] Error for ${providerName}:`, e);
    return FALLBACK_PROVIDER_CONFIGS[providerName] || null;
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

    if (error || !data?.length) return ["openrouter"];
    return data.map((p: any) => p.provider_name);
  } catch {
    return ["openrouter"];
  }
}

// Get model config for scope
async function getModelConfig(supabase: any, scopeType: string): Promise<{ provider: string; model: string }> {
  try {
    const { data, error } = await supabase
      .from("ai_model_config")
      .select("provider, model_id, is_active")
      .eq("function_type", scopeType)
      .single();

    if (error || !data || !data.is_active) {
      return DEFAULT_MODELS[scopeType] || DEFAULT_MODELS.ai_control_panel;
    }

    return { provider: data.provider, model: data.model_id };
  } catch {
    return DEFAULT_MODELS[scopeType] || DEFAULT_MODELS.ai_control_panel;
  }
}

// Log usage
async function logUsage(
  supabase: any,
  provider: string,
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
      provider_name: provider,
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

// ==========================================
// PROVIDER ADAPTERS
// ==========================================

// Scope to 1min.ai type mapping
const SCOPE_TO_ONEMIN_TYPE: Record<string, string> = {
  code_generation: "CODE_GENERATOR",
  code_fixing: "CODE_GENERATOR",
  content_generation: "CONTENT_GENERATOR",
  seo_optimization: "CONTENT_GENERATOR",
  page_builder: "CONTENT_GENERATOR",
  menu_builder: "CONTENT_GENERATOR",
  customer_chat: "CHAT_WITH_AI",
  admin_ai_assistant: "CHAT_WITH_AI",
  ai_control_panel: "CHAT_WITH_AI",
  security_audit: "CHAT_WITH_AI",
  vision_documents: "CHAT_WITH_IMAGE",
  image_prompt_generation: "CHAT_WITH_AI",
  agentic_tasks: "CHAT_WITH_AI",
};

// 1min.ai Native Adapter
async function callOneMinAI(
  apiKey: string,
  model: string,
  messages: any[],
  scope: string,
  context?: any,
  config?: ProviderConfig
): Promise<{ content: string; usage: any; fallback?: { needed: boolean; reason: string } }> {
  const type = SCOPE_TO_ONEMIN_TYPE[scope] || "CHAT_WITH_AI";
  const settings = config?.settings || {};
  
  // Choose endpoint based on type
  const endpoint = type === "CHAT_WITH_AI" 
    ? (settings.conversationsUrl || "https://api.1min.ai/api/conversations")
    : (settings.featuresUrl || "https://api.1min.ai/api/features");

  const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");

  const body: Record<string, any> = {
    model,
    type,
    promptObject: {
      prompt,
      isMixed: false,
      webSearch: false,
    },
  };

  // Handle vision
  if (type === "CHAT_WITH_IMAGE" && context?.imageUrl) {
    body.promptObject.imageUrls = [context.imageUrl];
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    // Handle blocked key or inactive API
    if (response.status === 401) {
      if (errorText.includes("API Key is not active") || errorText.includes("Unauthorized")) {
        return {
          content: "",
          usage: null,
          fallback: { needed: true, reason: "1min.ai key blocked or inactive (401)" },
        };
      }
    }
    
    throw new Error(`1min.ai error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.aiRecord?.aiRecordDetail?.resultText || data.result || data.output || "",
    usage: {
      prompt_tokens: data.usage?.inputTokens || 0,
      completion_tokens: data.usage?.outputTokens || 0,
      total_tokens: (data.usage?.inputTokens || 0) + (data.usage?.outputTokens || 0),
    },
  };
}

// Google Gemini Native Adapter (NOT OpenAI compatible)
async function callGeminiNative(
  apiKey: string,
  model: string,
  messages: any[],
  config?: ProviderConfig
): Promise<{ content: string; usage: any }> {
  const baseUrl = config?.baseUrl || "https://generativelanguage.googleapis.com/v1";
  const url = `${baseUrl}/models/${model}:generateContent`;

  // Convert messages to Gemini format
  const contents = messages.map(msg => ({
    role: msg.role === "assistant" ? "model" : msg.role === "system" ? "user" : msg.role,
    parts: [{ text: msg.content }],
  }));

  // If first message was system, prepend it to user message
  if (messages[0]?.role === "system" && messages.length > 1) {
    contents[1].parts[0].text = `${messages[0].content}\n\n${contents[1].parts[0].text}`;
    contents.shift();
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return {
    content: textContent,
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: data.usageMetadata?.totalTokenCount || 0,
    },
  };
}

// Fetch Gemini models list
async function fetchGeminiModels(apiKey: string, baseUrl: string): Promise<any[]> {
  const url = `${baseUrl}/models?key=${apiKey}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Gemini models: ${response.status}`);
  }
  
  const data = await response.json();
  return data.models?.filter((m: any) => m.supportedGenerationMethods?.includes("generateContent")) || [];
}

// OpenAI-compatible adapter (OpenRouter, Groq, etc.)
async function callOpenAICompatible(
  provider: string,
  apiKey: string,
  model: string,
  messages: any[],
  stream: boolean = false,
  config?: ProviderConfig
): Promise<{ content: string; usage: any; stream?: ReadableStream }> {
  const fallbackConfig = FALLBACK_PROVIDER_CONFIGS[provider];
  const baseUrl = config?.baseUrl || fallbackConfig?.baseUrl;
  
  if (!baseUrl) throw new Error(`Unknown provider: ${provider}`);

  // Build URL - append /chat/completions if not already in baseUrl
  let url = baseUrl;
  if (!baseUrl.includes("/chat/completions")) {
    url = baseUrl.endsWith("/") ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
  }

  const authHeader = config?.authHeader || fallbackConfig?.authHeader || "Authorization";
  const authType = config?.authType || fallbackConfig?.authType || "bearer";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    [authHeader]: authType === "bearer" ? `Bearer ${apiKey}` : apiKey,
  };

  // Add extra headers
  const extraHeaders = config?.extraHeaders || fallbackConfig?.extraHeaders;
  if (extraHeaders) {
    Object.assign(headers, extraHeaders);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
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
    throw new Error(`${provider} error: ${response.status} - ${errorText}`);
  }

  if (stream) {
    return { content: "", usage: null, stream: response.body || undefined };
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    usage: data.usage,
  };
}

// Build system prompt based on scope type
function buildSystemPrompt(type: string): string {
  const prompts: Record<string, string> = {
    customer_chat: `You are DFSA Assistant for Dragon Fruit Farming Africa - South Africa's premier dragon fruit nursery since 2008.
Help customers find dragon fruit cultivars, provide service info, make recommendations.
Key: We sell UNROOTED CUTTINGS. Rooting service available. Export worldwide. Contact: +27 83 447 4639
Be helpful, warm, and professional! 🌿`,

    admin_ai_assistant: `You are an AI assistant for the Dragon Fruit Farming Africa admin panel.
Help with: product descriptions, SEO, marketing, customer communication, code review, and business operations.`,

    ai_control_panel: `You are a helpful AI assistant. Respond concisely and accurately.`,

    code_generation: `You are an expert software engineer. Generate clean, efficient, well-documented code.
Follow best practices. Include error handling. Explain your approach briefly.`,

    code_fixing: `You are a senior software engineer specializing in debugging and code optimization.
Identify issues, explain the problem, and provide the fixed code.`,

    security_audit: `You are a senior security engineer conducting code audits.
Format severity: **CRITICAL**, **HIGH**, **MEDIUM**, **LOW**, **INFO**
Analyze: Authentication, authorization, input validation, injection flaws, payment security, RLS policies.`,

    seo_optimization: `You are an SEO specialist. Generate optimized meta tags:
- Title: Under 60 chars with main keyword
- Description: Under 160 chars, compelling CTA
- Keywords: 5-10 relevant terms
Return as JSON: { "title": "", "description": "", "keywords": [] }`,

    content_generation: `You are a content marketing specialist for Dragon Fruit Farming Africa.
Create engaging, SEO-friendly content celebrating dragon fruit cultivation in South Africa.`,

    vision_documents: `You are an AI that analyzes images. Describe visual elements, composition, colors, and any text visible.`,

    image_prompt_generation: `You are an expert at crafting image generation prompts. Create detailed, vivid prompts for AI image generators.`,

    page_builder: `You are a web page content generator. Create structured content for website pages.`,

    menu_builder: `You are a navigation/menu structure expert. Generate logical menu hierarchies.`,

    agentic_tasks: `You are an autonomous agent capable of planning and executing multi-step tasks.
Break down complex requests, reason through each step, and provide actionable results.`,
  };

  return prompts[type] || prompts.ai_control_panel;
}

// ==========================================
// MAIN HANDLER
// ==========================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Try to get user ID from auth header
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      userId = data.user?.id || null;
    }

    const requestData: AIRequest = await req.json();
    const { 
      type, 
      prompt, 
      messages, 
      context, 
      provider: requestedProvider, 
      model: requestedModel, 
      stream = false,
      testMode = false,
      diagnosticAction,
    } = requestData;

    // ==========================================
    // DIAGNOSTIC ACTIONS
    // ==========================================
    if (diagnosticAction === "fetch_models") {
      const provider = requestedProvider || "google_ai_studio";
      const config = await getProviderConfig(supabase, provider);
      
      if (!config) {
        return new Response(
          JSON.stringify({ error: `Provider ${provider} not configured` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { key, source } = await resolveAPIKey(supabase, provider, config.secretKey);

      if (provider === "google_ai_studio" || config.apiFormat === "gemini_native") {
        const models = await fetchGeminiModels(key, config.baseUrl);
        return new Response(
          JSON.stringify({ 
            success: true, 
            provider,
            models: models.map((m: any) => ({
              id: m.name?.replace("models/", ""),
              name: m.displayName,
              inputTokenLimit: m.inputTokenLimit,
              outputTokenLimit: m.outputTokenLimit,
            })),
            key_source_used: source,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          provider,
          models: "manual_list",
          message: "This provider does not have a models API. Use model IDs from documentation.",
          key_source_used: source,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (diagnosticAction === "key_test") {
      const provider = requestedProvider || "openrouter";
      const config = await getProviderConfig(supabase, provider);
      
      if (!config) {
        return new Response(
          JSON.stringify({ 
            provider_tested: provider,
            status_code: 404,
            message: "Provider not configured or disabled",
            key_source_used: null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const { key, source } = await resolveAPIKey(supabase, provider, config.secretKey);
        return new Response(
          JSON.stringify({ 
            provider_tested: provider,
            status_code: 200,
            message: "API key found and active",
            key_source_used: source,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e: any) {
        return new Response(
          JSON.stringify({ 
            provider_tested: provider,
            status_code: 404,
            message: e.message,
            key_source_used: null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ==========================================
    // NORMAL AI REQUEST FLOW
    // ==========================================

    // Get per-scope config (ALWAYS honored first)
    const scopeType = type || "ai_control_panel";
    const scopeConfig = await getModelConfig(supabase, scopeType);
    
    // Determine provider/model: explicit request > scope config > default
    const configuredProvider = requestedProvider || scopeConfig.provider;
    const configuredModel = requestedModel || scopeConfig.model;

    let selectedProvider = configuredProvider;
    let selectedModel = configuredModel;

    console.log(`[Request] Scope: ${scopeType}, Provider: ${selectedProvider}, Model: ${selectedModel}`);

    // Get fallback providers (for runtime failures only)
    const providerPriority = await getProviderPriority(supabase);

    // Build messages
    const systemPrompt = buildSystemPrompt(scopeType);
    let finalMessages: Array<{ role: string; content: string }>;

    if (messages?.length) {
      finalMessages = [{ role: "system", content: systemPrompt }, ...messages];
    } else {
      finalMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt || "Hello" },
      ];
    }

    // Track debug info
    const debugInfo: DebugInfo = {
      scope_used: scopeType,
      provider_configured: configuredProvider,
      provider_used: selectedProvider,
      model_used: selectedModel,
      base_url_used: "",
      key_source_used: "env",
      fallback_used: false,
    };

    // Try configured provider first, then fallback chain
    // 1min.ai is the reliable primary (has working API key)
    const providersToTry = [
      selectedProvider,
      ...providerPriority.filter(p => p !== selectedProvider),
      "onemin", // 1min.ai as primary fallback (working key)
    ].filter((v, i, a) => a.indexOf(v) === i); // Dedupe

    let lastError: Error | null = null;
    let result: any = null;

    for (const provider of providersToTry) {
      try {
        const providerConfig = await getProviderConfig(supabase, provider);
        if (!providerConfig) {
          console.log(`[Skip] ${provider}: not configured`);
          continue;
        }

        // Resolve API key
        let apiKey: string;
        let keySource: "vault" | "env";
        try {
          const resolved = await resolveAPIKey(supabase, provider, providerConfig.secretKey);
          apiKey = resolved.key;
          keySource = resolved.source;
        } catch (keyError: any) {
          console.log(`[Skip] ${provider}: ${keyError.message}`);
          lastError = keyError;
          continue;
        }

        console.log(`[Try] Provider: ${provider}, Format: ${providerConfig.apiFormat}`);

        // Use appropriate model for fallback provider
        let modelToUse = selectedModel;
        if (provider !== selectedProvider) {
          debugInfo.fallback_used = true;
          debugInfo.fallback_reason = lastError?.message || "Primary provider unavailable";
          
          // Get default model for fallback provider
          if (provider === "onemin") {
            modelToUse = "gpt-4o-mini"; // Via 1min.ai
          } else if (provider === "perplexity") {
            modelToUse = "llama-3.1-sonar-small-128k-chat";
          } else if (provider === "openai") {
            modelToUse = "gpt-4o-mini";
          } else if (provider === "openrouter") {
            modelToUse = "meta-llama/llama-3.3-70b-instruct";
          } else if (provider === "groq") {
            modelToUse = "llama-3.1-8b-instant";
          } else if (provider === "google_ai_studio") {
            modelToUse = "gemini-1.5-flash";
          }
        }

        debugInfo.provider_used = provider;
        debugInfo.model_used = modelToUse;
        debugInfo.base_url_used = providerConfig.baseUrl;
        debugInfo.key_source_used = keySource;

        // Call appropriate adapter based on API format
        if (provider === "onemin" || providerConfig.apiFormat === "onemin_features") {
          result = await callOneMinAI(apiKey, modelToUse, finalMessages, scopeType, context, providerConfig);
          
          // Check for fallback signal
          if (result.fallback?.needed) {
            debugInfo.fallback_reason = result.fallback.reason;
            lastError = new Error(result.fallback.reason);
            continue;
          }
        } else if (provider === "google_ai_studio" || providerConfig.apiFormat === "gemini_native") {
          result = await callGeminiNative(apiKey, modelToUse, finalMessages, providerConfig);
        } else {
          result = await callOpenAICompatible(provider, apiKey, modelToUse, finalMessages, stream, providerConfig);
        }

        // Log successful usage
        const responseTime = Date.now() - startTime;
        await logUsage(supabase, provider, modelToUse, scopeType, userId, result.usage, true, null, responseTime);

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
            provider,
            model: modelToUse,
            usage: result.usage,
            debug: debugInfo,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      } catch (err: any) {
        console.error(`[Fail] ${provider}:`, err.message);
        lastError = err;
        
        const responseTime = Date.now() - startTime;
        await logUsage(supabase, provider, selectedModel, scopeType, userId, null, false, err.message, responseTime);
        
        continue;
      }
    }

    // All providers failed
    throw lastError || new Error("All AI providers failed");

  } catch (error: any) {
    console.error("[Error]", error);
    return new Response(
      JSON.stringify({
        error: error.message || "AI service unavailable",
        fix: "Check API keys and provider configuration",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
