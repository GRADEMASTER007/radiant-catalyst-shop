/**
 * AI Models Registry
 * z.ai is the ONLY provider
 */

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

// z.ai Models
export const ZAI_MODELS: AIModel[] = [
  { id: "GLM-4.7", name: "GLM-4.7 (Primary)", provider: "z.ai", recommended: true, capabilities: ["chat", "content", "code", "seo", "reasoning"] },
  { id: "GLM-4.5-AIR", name: "GLM-4.5-AIR (Fallback)", provider: "z.ai", capabilities: ["chat", "content"] },
];

// Single provider
export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "z.ai",
    name: "Z.AI Coding Plan",
    baseUrl: "https://api.z.ai/api/coding/paas/v4",
    authType: "bearer",
    models: ZAI_MODELS,
  },
];

export const DEFAULT_MODEL = "GLM-4.7";
export const FALLBACK_MODEL = "GLM-4.5-AIR";
export const AI_PROVIDER = "z.ai";

// Function type definitions
export const AI_FUNCTION_TYPES = [
  { id: "chat", name: "Customer Chat", icon: "MessageCircle", description: "Website chat and support" },
  { id: "content", name: "Content Generation", icon: "FileText", description: "Product descriptions, marketing" },
  { id: "seo", name: "SEO Optimization", icon: "Search", description: "Meta tags, keywords" },
  { id: "blog", name: "Blog Generation", icon: "FileText", description: "Auto-generate blog posts" },
  { id: "page", name: "Page Generation", icon: "Layout", description: "Auto-generate pages" },
  { id: "image", name: "Image Generation", icon: "Image", description: "Image prompts and analysis" },
  { id: "coding", name: "Code Generation", icon: "Code", description: "Code writing and debugging" },
  { id: "audit", name: "Security Audit", icon: "Shield", description: "Security analysis and review" },
];

export function getModelsForProvider(providerId: string): AIModel[] {
  const provider = AI_PROVIDERS.find(p => p.id === providerId);
  return provider?.models || [];
}

export function findModel(modelId: string): { model: AIModel; provider: AIProvider } | null {
  for (const provider of AI_PROVIDERS) {
    const model = provider.models.find(m => m.id === modelId);
    if (model) return { model, provider };
  }
  return null;
}

export function getRecommendedModels(_functionType?: string): AIModel[] {
  return ZAI_MODELS;
}
