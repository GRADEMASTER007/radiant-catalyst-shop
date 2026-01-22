// Complete AI Models Registry for Multi-Provider System

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  free?: boolean;
  recommended?: boolean;
  capabilities?: string[];
}

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  authType: "bearer" | "api-key";
  models: AIModel[];
}

// 1min.AI Models (120+ models via lifetime plan)
export const ONEMIN_AI_MODELS: AIModel[] = [
  // Alibaba
  { id: "qwen3-max", name: "Qwen3 Max", provider: "Alibaba" },
  { id: "qwen-plus", name: "Qwen Plus", provider: "Alibaba" },
  { id: "qwen-max", name: "Qwen Max", provider: "Alibaba" },
  { id: "qwen-flash", name: "Qwen Flash", provider: "Alibaba" },
  // Anthropic
  { id: "claude-sonnet-4-5-20250929", name: "Claude 4.5 Sonnet", provider: "Anthropic" },
  { id: "claude-sonnet-4-20250514", name: "Claude 4 Sonnet", provider: "Anthropic", recommended: true },
  { id: "claude-opus-4-5-20251101", name: "Claude 4.5 Opus", provider: "Anthropic" },
  { id: "claude-opus-4-20250514", name: "Claude 4 Opus", provider: "Anthropic" },
  { id: "claude-opus-4-1-20250805", name: "Claude 4.1 Opus", provider: "Anthropic" },
  { id: "claude-haiku-4-5-20251001", name: "Claude 4.5 Haiku", provider: "Anthropic" },
  // DeepSeek
  { id: "deepseek-reasoner", name: "DeepSeek V3.2 Reasoner", provider: "DeepSeek", capabilities: ["reasoning", "audit"] },
  { id: "deepseek-chat", name: "DeepSeek V3.2 Chat", provider: "DeepSeek" },
  // Google
  { id: "gemini-3-pro-preview", name: "Gemini 3 Pro Preview", provider: "Google" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", recommended: true },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
  // Mistral
  { id: "magistral-small-latest", name: "Magistral Small", provider: "Mistral" },
  { id: "magistral-medium-latest", name: "Magistral Medium", provider: "Mistral" },
  { id: "ministral-14b-latest", name: "Ministral 14B", provider: "Mistral" },
  { id: "open-mistral-nemo", name: "Mistral Nemo", provider: "Mistral" },
  { id: "mistral-small-latest", name: "Mistral Small", provider: "Mistral" },
  { id: "mistral-medium-latest", name: "Mistral Medium", provider: "Mistral" },
  { id: "mistral-large-latest", name: "Mistral Large 2", provider: "Mistral" },
  // OpenAI
  { id: "gpt-5.2-pro", name: "GPT-5.2 Pro", provider: "OpenAI" },
  { id: "gpt-5.2", name: "GPT-5.2", provider: "OpenAI" },
  { id: "gpt-5.1", name: "GPT-5.1", provider: "OpenAI" },
  { id: "gpt-5-nano", name: "GPT-5 Nano", provider: "OpenAI" },
  { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "OpenAI" },
  { id: "gpt-5-chat-latest", name: "GPT-5 Chat", provider: "OpenAI" },
  { id: "gpt-5", name: "GPT-5", provider: "OpenAI" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", recommended: true },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", capabilities: ["vision"] },
  { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", provider: "OpenAI" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "OpenAI" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "OpenAI" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI" },
  { id: "o4-mini", name: "O4 Mini", provider: "OpenAI" },
  { id: "o4-mini-deep-research", name: "O4 Mini Deep Research", provider: "OpenAI" },
  { id: "o3-mini", name: "O3 Mini", provider: "OpenAI" },
  { id: "o3-pro", name: "O3 Pro", provider: "OpenAI" },
  { id: "o3-deep-research", name: "O3 Deep Research", provider: "OpenAI" },
  { id: "o3", name: "O3", provider: "OpenAI" },
  { id: "gpt-5.1-codex-mini", name: "GPT-5.1 Codex Mini", provider: "OpenAI", capabilities: ["coding"] },
  { id: "gpt-5.1-codex", name: "GPT-5.1 Codex", provider: "OpenAI", capabilities: ["coding"] },
  // Perplexity
  { id: "sonar-reasoning-pro", name: "Sonar Reasoning Pro", provider: "Perplexity" },
  { id: "sonar-reasoning", name: "Sonar Reasoning", provider: "Perplexity" },
  { id: "sonar-pro", name: "Sonar Pro", provider: "Perplexity" },
  { id: "sonar-deep-research", name: "Sonar Deep Research", provider: "Perplexity" },
  { id: "sonar", name: "Sonar", provider: "Perplexity" },
  // xAI
  { id: "grok-4-fast-reasoning", name: "Grok 4 Fast Reasoning", provider: "xAI" },
  { id: "grok-4-fast-non-reasoning", name: "Grok 4 Fast", provider: "xAI" },
  { id: "grok-4-0709", name: "Grok 4", provider: "xAI" },
  { id: "grok-3-mini", name: "Grok 3 Mini", provider: "xAI" },
  { id: "grok-3", name: "Grok 3", provider: "xAI" },
  // Meta
  { id: "meta/meta-llama-3.1-405b-instruct", name: "LLaMA 3.1 405B", provider: "Meta" },
  { id: "meta/meta-llama-3-70b-instruct", name: "LLaMA 3 70B", provider: "Meta" },
  { id: "meta/llama-4-scout-instruct", name: "LLaMA 4 Scout", provider: "Meta" },
  { id: "meta/llama-4-maverick-instruct", name: "LLaMA 4 Maverick", provider: "Meta" },
  { id: "meta/llama-2-70b-chat", name: "LLaMA 2 70B", provider: "Meta" },
  // OpenAI OSS
  { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", provider: "OpenAI" },
  { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", provider: "OpenAI" },
];

// OpenRouter Free Models
export const OPENROUTER_FREE_MODELS: AIModel[] = [
  { id: "deepseek/deepseek-chat:free", name: "DeepSeek Chat", provider: "DeepSeek", free: true },
  { id: "deepseek/deepseek-coder:free", name: "DeepSeek Coder", provider: "DeepSeek", free: true, capabilities: ["coding"] },
  { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1", provider: "DeepSeek", free: true, capabilities: ["reasoning", "audit"], recommended: true },
  { id: "google/gemini-flash-1.5:free", name: "Gemini Flash 1.5", provider: "Google", free: true, recommended: true },
  { id: "google/gemini-pro:free", name: "Gemini Pro", provider: "Google", free: true },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "LLaMA 3.3 70B", provider: "Meta", free: true },
  { id: "meta-llama/llama-3.2-3b-instruct:free", name: "LLaMA 3.2 3B", provider: "Meta", free: true },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B", provider: "Mistral", free: true },
  { id: "qwen/qwen-2.5-32b-instruct:free", name: "Qwen 2.5 32B", provider: "Alibaba", free: true },
  { id: "cohere/command-r:free", name: "Command R", provider: "Cohere", free: true },
];

// OpenRouter Paid Models
export const OPENROUTER_PAID_MODELS: AIModel[] = [
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI", capabilities: ["vision"] },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI" },
  { id: "google/gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", provider: "Google" },
];

// Other Free Provider Models
export const DEEPINFRA_MODELS: AIModel[] = [
  { id: "meta-llama/llama-3.1-8b-instruct", name: "LLaMA 3.1 8B", provider: "Meta", free: true },
  { id: "mistralai/Mistral-7B-Instruct", name: "Mistral 7B", provider: "Mistral", free: true },
];

export const TOGETHER_MODELS: AIModel[] = [
  { id: "meta-llama/llama-3.1-8b-instruct", name: "LLaMA 3.1 8B", provider: "Meta", free: true },
];

export const GOOGLE_AI_MODELS: AIModel[] = [
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "Google", free: true },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google", free: true },
];

export const GROQ_MODELS: AIModel[] = [
  { id: "llama-3.1-8b-instant", name: "LLaMA 3.1 8B Instant", provider: "Meta", free: true },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "Mistral", free: true },
];

export const HUGGINGFACE_MODELS: AIModel[] = [
  { id: "meta-llama/Llama-2-70b-chat-hf", name: "LLaMA 2 70B", provider: "Meta", free: true },
];

// All providers configuration
export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "1min.ai",
    name: "1min.AI (Primary)",
    baseUrl: "https://api.1min.ai/api",
    authType: "api-key",
    models: ONEMIN_AI_MODELS,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    authType: "bearer",
    models: [...OPENROUTER_FREE_MODELS, ...OPENROUTER_PAID_MODELS],
  },
  {
    id: "deepinfra",
    name: "DeepInfra",
    baseUrl: "https://api.deepinfra.com/v1/openai/chat/completions",
    authType: "bearer",
    models: DEEPINFRA_MODELS,
  },
  {
    id: "together",
    name: "Together AI",
    baseUrl: "https://api.together.xyz/v1/chat/completions",
    authType: "bearer",
    models: TOGETHER_MODELS,
  },
  {
    id: "google",
    name: "Google AI Studio",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    authType: "bearer",
    models: GOOGLE_AI_MODELS,
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    authType: "bearer",
    models: GROQ_MODELS,
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    baseUrl: "https://api-inference.huggingface.co/models/",
    authType: "bearer",
    models: HUGGINGFACE_MODELS,
  },
];

// Function type definitions
export const AI_FUNCTION_TYPES = [
  { id: "chat", name: "Customer Chat", icon: "MessageCircle", description: "Website chat and support" },
  { id: "content", name: "Content Generation", icon: "FileText", description: "Product descriptions, marketing" },
  { id: "seo", name: "SEO Optimization", icon: "Search", description: "Meta tags, keywords" },
  { id: "coding", name: "Code Generation", icon: "Code", description: "Code writing and debugging" },
  { id: "audit", name: "Security Audit", icon: "Shield", description: "Security analysis and review" },
  { id: "vision", name: "Image Analysis", icon: "Image", description: "Image understanding" },
  { id: "reasoning", name: "Complex Reasoning", icon: "Brain", description: "Deep thinking tasks" },
  { id: "fast", name: "Quick Tasks", icon: "Zap", description: "Simple, fast responses" },
];

// Get all models for a provider
export function getModelsForProvider(providerId: string): AIModel[] {
  const provider = AI_PROVIDERS.find(p => p.id === providerId);
  return provider?.models || [];
}

// Get model by ID across all providers
export function findModel(modelId: string): { model: AIModel; provider: AIProvider } | null {
  for (const provider of AI_PROVIDERS) {
    const model = provider.models.find(m => m.id === modelId);
    if (model) {
      return { model, provider };
    }
  }
  return null;
}

// Get recommended models for a function type
export function getRecommendedModels(functionType: string): AIModel[] {
  const allModels = AI_PROVIDERS.flatMap(p => p.models);
  return allModels.filter(m => 
    m.recommended || 
    m.capabilities?.includes(functionType) ||
    m.free
  );
}
