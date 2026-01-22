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
// ==========================================

// Static fallback configs (used only if database is unreachable)
const FALLBACK_PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  "1min.ai": {
    baseUrl: "https://api.1min.ai/api/features",
    streamUrl: "https://api.1min.ai/api/features?isStreaming=true",
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
  together: {
    baseUrl: "https://api.together.xyz/v1/chat/completions",
    authHeader: "Authorization",
    authType: "bearer",
    secretKey: "TOGETHER_API_KEY",
  },
  google: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    authHeader: "Authorization",
    authType: "bearer",
    secretKey: "GOOGLE_AI_API_KEY",
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    authHeader: "Authorization",
    authType: "bearer",
    secretKey: "GROQ_API_KEY",
  },
  huggingface: {
    baseUrl: "https://api-inference.huggingface.co/models",
    authHeader: "Authorization",
    authType: "bearer",
    secretKey: "HUGGINGFACE_TOKEN",
  },
};

interface ProviderConfig {
  baseUrl: string;
  streamUrl?: string;
  authHeader: string;
  authType: string;
  secretKey: string;
  extraHeaders?: Record<string, string>;
}

// ==========================================
// SECRET KEY RESOLUTION
// Priority: 1) API Key Vault → 2) .env.ai → 3) Error
// 
// Maps provider names to their environment variable names.
// These keys are NEVER exposed to client code.
// ==========================================
const PROVIDER_SECRET_KEYS: Record<string, string> = {
  // Core providers
  "1min.ai": "ONEMIN_AI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_AI_API_KEY",
  groq: "GROQ_API_KEY",
  mistral: "MISTRAL_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
  fireworks: "FIREWORKS_API_KEY",
  huggingface: "HUGGINGFACE_TOKEN",
  // Legacy/alternative providers
  deepinfra: "DEEPINFRA_API_KEY",
  together: "TOGETHER_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  // Cloud/Enterprise providers
  azure_openai: "AZURE_OPENAI_API_KEY",
  bedrock: "AWS_ACCESS_KEY_ID",
  vertex: "GOOGLE_VERTEX_API_KEY",
  // Image generation
  stability: "STABILITY_API_KEY",
  replicate: "REPLICATE_API_KEY",
  leonardo: "LEONARDO_API_KEY",
  clipdrop: "CLIPDROP_API_KEY",
};

// Resolve API key with 3-tier priority: Vault → .env.ai → Error
async function resolveAPIKey(
  supabase: any,
  providerName: string,
  secretKeyName: string
): Promise<string> {
  // TIER 1: Try API Key Vault (database)
  try {
    const { data: vaultKey, error } = await supabase
      .from("api_keys_vault")
      .select("key_value, is_active")
      .eq("service_type", providerName)
      .eq("is_active", true)
      .single();

    if (!error && vaultKey?.key_value) {
      console.log(`[Key Resolution] ${providerName}: Using API Key Vault`);
      // Update last_used_at
      await supabase
        .from("api_keys_vault")
        .update({ last_used_at: new Date().toISOString() })
        .eq("service_type", providerName);
      return vaultKey.key_value;
    }
  } catch (e) {
    console.log(`[Key Resolution] ${providerName}: Vault lookup failed, trying .env.ai`);
  }

  // TIER 2: Try .env.ai (environment variables)
  const envKey = Deno.env.get(secretKeyName);
  if (envKey) {
    console.log(`[Key Resolution] ${providerName}: Using .env.ai (${secretKeyName})`);
    return envKey;
  }

  // TIER 3: Error - no key found
  const errorMsg = `API key not found for provider: ${providerName}. ` +
    `Please configure in API Key Vault OR add ${secretKeyName} to .env.ai`;
  console.error(`[Key Resolution] ${providerName}: ${errorMsg}`);
  throw new Error(errorMsg);
}

// Fetch provider config from database, fallback to static config
async function getProviderConfig(supabase: any, providerName: string): Promise<ProviderConfig> {
  try {
    const { data, error } = await supabase
      .from("ai_provider_config")
      .select("base_url, auth_type, auth_header, settings")
      .eq("provider_name", providerName)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      console.log(`Using fallback config for ${providerName}`);
      return FALLBACK_PROVIDER_CONFIGS[providerName] || FALLBACK_PROVIDER_CONFIGS.openrouter;
    }

    // Read secretKey from settings if available, else use static mapping
    const secretKey = data.settings?.secretKey || PROVIDER_SECRET_KEYS[providerName] || "OPENROUTER_API_KEY";

    return {
      baseUrl: data.base_url,
      authHeader: data.auth_header || "Authorization",
      authType: data.auth_type || "bearer",
      secretKey,
      extraHeaders: data.settings?.extraHeaders,
      streamUrl: data.settings?.streamUrl,
    };
  } catch (e) {
    console.error(`Error fetching provider config for ${providerName}:`, e);
    return FALLBACK_PROVIDER_CONFIGS[providerName] || FALLBACK_PROVIDER_CONFIGS.openrouter;
  }
}

// All available models by provider
const ALL_MODELS = {
  "1min.ai": {
    // Alibaba
    "qwen3-max": { name: "Qwen3 Max", provider: "Alibaba" },
    "qwen-plus": { name: "Qwen Plus", provider: "Alibaba" },
    "qwen-max": { name: "Qwen Max", provider: "Alibaba" },
    "qwen-flash": { name: "Qwen Flash", provider: "Alibaba" },
    // Anthropic
    "claude-sonnet-4-5-20250929": { name: "Claude 4.5 Sonnet", provider: "Anthropic" },
    "claude-sonnet-4-20250514": { name: "Claude 4 Sonnet", provider: "Anthropic" },
    "claude-opus-4-5-20251101": { name: "Claude 4.5 Opus", provider: "Anthropic" },
    "claude-opus-4-20250514": { name: "Claude 4 Opus", provider: "Anthropic" },
    "claude-haiku-4-5-20251001": { name: "Claude 4.5 Haiku", provider: "Anthropic" },
    // DeepSeek
    "deepseek-reasoner": { name: "DeepSeek Reasoner", provider: "DeepSeek" },
    "deepseek-chat": { name: "DeepSeek Chat", provider: "DeepSeek" },
    // Google
    "gemini-3-pro-preview": { name: "Gemini 3 Pro", provider: "Google" },
    "gemini-2.5-pro": { name: "Gemini 2.5 Pro", provider: "Google" },
    "gemini-2.5-flash": { name: "Gemini 2.5 Flash", provider: "Google" },
    // Mistral
    "magistral-small-latest": { name: "Magistral Small", provider: "Mistral" },
    "magistral-medium-latest": { name: "Magistral Medium", provider: "Mistral" },
    "ministral-14b-latest": { name: "Ministral 14B", provider: "Mistral" },
    "open-mistral-nemo": { name: "Mistral Nemo", provider: "Mistral" },
    "mistral-small-latest": { name: "Mistral Small", provider: "Mistral" },
    "mistral-medium-latest": { name: "Mistral Medium", provider: "Mistral" },
    "mistral-large-latest": { name: "Mistral Large 2", provider: "Mistral" },
    // OpenAI
    "gpt-5.2-pro": { name: "GPT-5.2 Pro", provider: "OpenAI" },
    "gpt-5.2": { name: "GPT-5.2", provider: "OpenAI" },
    "gpt-5.1": { name: "GPT-5.1", provider: "OpenAI" },
    "gpt-5-nano": { name: "GPT-5 Nano", provider: "OpenAI" },
    "gpt-5-mini": { name: "GPT-5 Mini", provider: "OpenAI" },
    "gpt-5-chat-latest": { name: "GPT-5 Chat", provider: "OpenAI" },
    "gpt-5": { name: "GPT-5", provider: "OpenAI" },
    "gpt-4o-mini": { name: "GPT-4o Mini", provider: "OpenAI" },
    "gpt-4o": { name: "GPT-4o", provider: "OpenAI" },
    "gpt-4.1-nano": { name: "GPT-4.1 Nano", provider: "OpenAI" },
    "gpt-4.1-mini": { name: "GPT-4.1 Mini", provider: "OpenAI" },
    "gpt-4.1": { name: "GPT-4.1", provider: "OpenAI" },
    "gpt-4-turbo": { name: "GPT-4 Turbo", provider: "OpenAI" },
    "gpt-3.5-turbo": { name: "GPT-3.5 Turbo", provider: "OpenAI" },
    "o4-mini": { name: "O4 Mini", provider: "OpenAI" },
    "o3-mini": { name: "O3 Mini", provider: "OpenAI" },
    "o3-pro": { name: "O3 Pro", provider: "OpenAI" },
    "o3": { name: "O3", provider: "OpenAI" },
    // Perplexity
    "sonar-reasoning-pro": { name: "Sonar Reasoning Pro", provider: "Perplexity" },
    "sonar-reasoning": { name: "Sonar Reasoning", provider: "Perplexity" },
    "sonar-pro": { name: "Sonar Pro", provider: "Perplexity" },
    "sonar-deep-research": { name: "Sonar Deep Research", provider: "Perplexity" },
    "sonar": { name: "Sonar", provider: "Perplexity" },
    // xAI
    "grok-4-fast-reasoning": { name: "Grok 4 Fast", provider: "xAI" },
    "grok-4-0709": { name: "Grok 4", provider: "xAI" },
    "grok-3-mini": { name: "Grok 3 Mini", provider: "xAI" },
    "grok-3": { name: "Grok 3", provider: "xAI" },
    // Meta
    "meta/meta-llama-3.1-405b-instruct": { name: "LLaMA 3.1 405B", provider: "Meta" },
    "meta/llama-4-maverick-instruct": { name: "LLaMA 4 Maverick", provider: "Meta" },
    "meta/llama-4-scout-instruct": { name: "LLaMA 4 Scout", provider: "Meta" },
  },
  openrouter: {
    "deepseek/deepseek-chat:free": { name: "DeepSeek Chat", provider: "DeepSeek", free: true },
    "deepseek/deepseek-coder:free": { name: "DeepSeek Coder", provider: "DeepSeek", free: true },
    "deepseek/deepseek-r1:free": { name: "DeepSeek R1", provider: "DeepSeek", free: true },
    "google/gemini-flash-1.5:free": { name: "Gemini Flash 1.5", provider: "Google", free: true },
    "google/gemini-pro:free": { name: "Gemini Pro", provider: "Google", free: true },
    "meta-llama/llama-3.3-70b-instruct": { name: "LLaMA 3.3 70B", provider: "Meta", free: true },
    "meta-llama/llama-3.2-3b-instruct:free": { name: "LLaMA 3.2 3B", provider: "Meta", free: true },
    "mistralai/mistral-7b-instruct:free": { name: "Mistral 7B", provider: "Mistral", free: true },
    "qwen/qwen-2.5-32b-instruct:free": { name: "Qwen 2.5 32B", provider: "Alibaba", free: true },
    "cohere/command-r:free": { name: "Command R", provider: "Cohere", free: true },
    "anthropic/claude-3.5-sonnet": { name: "Claude 3.5 Sonnet", provider: "Anthropic" },
    "openai/gpt-4o": { name: "GPT-4o", provider: "OpenAI" },
    "openai/gpt-4o-mini": { name: "GPT-4o Mini", provider: "OpenAI" },
  },
  deepinfra: {
    "meta-llama/llama-3.1-8b-instruct": { name: "LLaMA 3.1 8B", provider: "Meta", free: true },
    "mistralai/Mistral-7B-Instruct": { name: "Mistral 7B", provider: "Mistral", free: true },
  },
  together: {
    "meta-llama/llama-3.1-8b-instruct": { name: "LLaMA 3.1 8B", provider: "Meta", free: true },
  },
  google: {
    "gemini-1.5-flash": { name: "Gemini 1.5 Flash", provider: "Google", free: true },
    "gemini-1.5-pro": { name: "Gemini 1.5 Pro", provider: "Google", free: true },
  },
  groq: {
    "llama-3.1-8b-instant": { name: "LLaMA 3.1 8B Instant", provider: "Meta", free: true },
    "mixtral-8x7b-32768": { name: "Mixtral 8x7B", provider: "Mistral", free: true },
  },
  huggingface: {
    "meta-llama/Llama-2-70b-chat-hf": { name: "LLaMA 2 70B", provider: "Meta", free: true },
  },
};

// Default models per function type
const DEFAULT_MODELS: Record<string, { provider: string; model: string }> = {
  chat: { provider: "1min.ai", model: "gpt-4o-mini" },
  coding: { provider: "openrouter", model: "deepseek/deepseek-coder:free" },
  reasoning: { provider: "openrouter", model: "deepseek/deepseek-r1:free" },
  audit: { provider: "openrouter", model: "deepseek/deepseek-r1:free" },
  seo: { provider: "openrouter", model: "google/gemini-flash-1.5:free" },
  content: { provider: "1min.ai", model: "gpt-4o-mini" },
  vision: { provider: "1min.ai", model: "gpt-4o" },
  fast: { provider: "openrouter", model: "google/gemini-flash-1.5:free" },
};

interface AIRequest {
  type: "product_description" | "seo_meta" | "content" | "custom" | "code_review" | "chat" | "audit" | "vision" | "pdf" | "youtube";
  prompt: string;
  messages?: Array<{ role: string; content: string }>;
  context?: {
    productName?: string;
    category?: string;
    keywords?: string[];
    existingDescription?: string;
    imageUrl?: string;
    fileUrl?: string;
    youtubeUrl?: string;
  };
  provider?: string;
  model?: string;
  stream?: boolean;
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

// Get model config for function type
async function getModelConfig(supabase: any, functionType: string): Promise<{ provider: string; model: string }> {
  try {
    const { data, error } = await supabase
      .from("ai_model_config")
      .select("provider, model_id, is_active")
      .eq("function_type", functionType)
      .single();

    if (error || !data || !data.is_active) {
      return DEFAULT_MODELS[functionType] || DEFAULT_MODELS.fast;
    }

    return { provider: data.provider, model: data.model_id };
  } catch {
    return DEFAULT_MODELS[functionType] || DEFAULT_MODELS.fast;
  }
}

// Log usage to database
async function logUsage(
  supabase: any,
  provider: string,
  model: string,
  functionType: string,
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
      function_type: functionType,
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

// Call 1min.AI
async function call1minAI(apiKey: string, model: string, messages: any[], type: string, context?: any): Promise<any> {
  const config = FALLBACK_PROVIDER_CONFIGS["1min.ai"];
  
  let conversationType = "CHAT_WITH_AI";
  const promptObject: any = {
    prompt: messages.map(m => `${m.role}: ${m.content}`).join("\n"),
    isMixed: false,
    webSearch: false,
  };

  // Handle special conversation types
  if (type === "vision" && context?.imageUrl) {
    conversationType = "CHAT_WITH_IMAGE";
    promptObject.imageUrls = [context.imageUrl];
  } else if (type === "pdf" && context?.fileUrl) {
    conversationType = "CHAT_WITH_PDF";
    promptObject.fileUrl = context.fileUrl;
  } else if (type === "youtube" && context?.youtubeUrl) {
    conversationType = "CHAT_WITH_YOUTUBE_VIDEO";
    promptObject.youtubeUrl = context.youtubeUrl;
  }

  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      "API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: conversationType,
      model,
      promptObject,
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
async function callOpenRouterCompatible(
  provider: string,
  apiKey: string,
  model: string,
  messages: any[],
  stream: boolean = false,
  providerConfig?: ProviderConfig
): Promise<any> {
  const config = providerConfig || FALLBACK_PROVIDER_CONFIGS[provider as keyof typeof FALLBACK_PROVIDER_CONFIGS];
  if (!config) throw new Error(`Unknown provider: ${provider}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    [config.authHeader]: config.authType === "bearer" ? `Bearer ${apiKey}` : apiKey,
  };

  // Add extra headers if available
  if ("extraHeaders" in config) {
    Object.assign(headers, config.extraHeaders);
  }

  const response = await fetch(config.baseUrl, {
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
    return { stream: response.body };
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    usage: data.usage,
  };
}

// Build system prompt based on request type
function buildSystemPrompt(type: string): string {
  const prompts: Record<string, string> = {
    product_description: `You are an expert e-commerce copywriter specializing in dragon fruit and agricultural products. 
Create compelling, SEO-optimized product descriptions that:
- Highlight the unique qualities and growing characteristics
- Use sensory language to describe the fruit's appearance and taste
- Include relevant keywords naturally
- Create urgency and desire
- Keep descriptions between 150-300 words`,

    seo_meta: `You are an SEO specialist for Dragon Fruit Farming Africa. Generate optimized meta tags:
- Title: Under 60 characters, include main keyword
- Description: Under 160 characters, compelling call-to-action
- Keywords: 5-10 relevant terms
Return as JSON: { "title": "", "description": "", "keywords": [] }`,

    content: `You are a content marketing specialist for Dragon Fruit Farming Africa. 
Create engaging content that:
- Celebrates dragon fruit cultivation and South African farming
- Is SEO-friendly and well-structured
- Uses proper heading hierarchy
- Maintains a professional, helpful brand voice`,

    code_review: `You are a senior software engineer specializing in code review, security auditing, and performance optimization.
Analyze code for:
- Security vulnerabilities (SQL injection, XSS, CSRF)
- Performance bottlenecks
- Best practices violations
- Authentication/authorization issues
Provide actionable feedback with severity levels.`,

    audit: `You are a senior fullstack security engineer conducting a comprehensive code audit.

FORMAT YOUR RESPONSE WITH SEVERITY MARKERS:
- **CRITICAL:** - Immediate security risk
- **HIGH:** - Significant vulnerability
- **MEDIUM:** - Moderate concern
- **LOW:** - Minor issue
- **INFO:** - Informational

ANALYZE:
1. SECURITY: Authentication, authorization, input validation, injection flaws
2. PAYMENT: Signature verification, amount validation, webhook security
3. DATABASE: RLS policies, data exposure
4. API: Rate limiting, error disclosure
5. CONFIGURATION: Secrets, CORS, environment variables`,

    chat: `You are DFSA Assistant for Dragon Fruit Farming Africa - South Africa's premier dragon fruit nursery since 2008.

Your Role:
- Help customers find perfect dragon fruit cultivars
- Provide information about services: consultations, rooting, business plans
- Make personalized recommendations

Key Info:
- We sell UNROOTED CUTTINGS
- Professional rooting service available
- Export worldwide
- Contact: +27 83 447 4639

Be helpful, warm, and professional! 🌿`,

    custom: `You are a helpful AI assistant for the Dragon Fruit Farming Africa admin panel.
Help with: product descriptions, SEO, marketing, customer communication, code review.`,

    vision: `You are an AI that analyzes images. Describe visual elements, composition, colors, and any text visible.`,

    pdf: `You are an AI that analyzes PDF documents. Extract key information and answer questions about the content.`,

    youtube: `You are an AI that analyzes YouTube videos. Summarize content and answer questions about the video.`,
  };

  return prompts[type] || prompts.custom;
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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Try to get user ID from auth header
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      userId = data.user?.id || null;
    }

    const requestData: AIRequest = await req.json();
    const { type, prompt, messages, context, provider: requestedProvider, model: requestedModel, stream = false } = requestData;

    // Get provider priority list
    const providerPriority = await getProviderPriority(supabase);

    // Determine which provider/model to use
    let selectedProvider = requestedProvider;
    let selectedModel = requestedModel;

    if (!selectedProvider || !selectedModel) {
      const configType = type === "code_review" ? "coding" : type === "product_description" || type === "seo_meta" ? "content" : type;
      const config = await getModelConfig(supabase, configType);
      selectedProvider = selectedProvider || config.provider;
      selectedModel = selectedModel || config.model;
    }

    console.log(`AI Request - Type: ${type}, Provider: ${selectedProvider}, Model: ${selectedModel}`);

    // Build messages
    const systemPrompt = buildSystemPrompt(type);
    let finalMessages: Array<{ role: string; content: string }>;

    if (messages?.length) {
      finalMessages = [{ role: "system", content: systemPrompt }, ...messages];
    } else {
      let userPrompt = prompt;
      if (type === "product_description" && context?.productName) {
        userPrompt = `Create a product description for "${context.productName}"${context.category ? ` in ${context.category}` : ""}.
${context.keywords?.length ? `Keywords: ${context.keywords.join(", ")}` : ""}
${context.existingDescription ? `Improve: ${context.existingDescription}` : ""}
${prompt}`;
      }
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
        // Fetch provider config from database (falls back to static config)
        const providerConfig = await getProviderConfig(supabase, provider);
        if (!providerConfig) continue;

        // Resolve API key with 3-tier priority
        let apiKey: string;
        try {
          apiKey = await resolveAPIKey(supabase, provider, providerConfig.secretKey);
        } catch (keyError: any) {
          console.log(`Skipping ${provider}: ${keyError.message}`);
          lastError = keyError;
          continue;
        }

        console.log(`Trying provider: ${provider}`);

        // Use appropriate model for this provider if switching providers
        let modelToUse = selectedModel;
        if (provider !== selectedProvider) {
          const providerModels = ALL_MODELS[provider as keyof typeof ALL_MODELS];
          if (providerModels) {
            // Get first available model for this provider
            modelToUse = Object.keys(providerModels)[0];
          }
        }

        if (provider === "1min.ai") {
          result = await call1minAI(apiKey, modelToUse, finalMessages, type, context);
        } else {
          result = await callOpenRouterCompatible(provider, apiKey, modelToUse, finalMessages, stream, providerConfig);
        }

        // Log successful usage
        const responseTime = Date.now() - startTime;
        await logUsage(supabase, provider, modelToUse, type, userId, result.usage, true, null, responseTime);

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
        await logUsage(supabase, provider, selectedModel, type, userId, null, false, err.message, responseTime);
        
        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw lastError || new Error("All AI providers failed");

  } catch (error: any) {
    console.error("AI Orchestrator error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "AI service unavailable",
        fix: "Check API keys and provider configuration",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
