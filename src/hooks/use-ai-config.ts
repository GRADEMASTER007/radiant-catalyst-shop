/**
 * Unified AI Configuration Hook
 * 
 * This hook provides access to the AI configuration layer, serving as the
 * SINGLE SOURCE OF TRUTH for AI behavior across the application.
 * 
 * Architecture Layer: AI Configuration (Layer 2)
 * - Assigns AI providers to functional scopes
 * - Defines which models are used per scope
 * - Allows model/provider changes without code rewrites
 * - References keys stored in the API Key Vault (Layer 1)
 * - All feature pages MUST use callAIGateway() instead of direct fetch calls
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// AI Functional Scopes as defined in architecture
export const AI_SCOPES = [
  { id: "customer_chat", name: "Customer Chat", description: "Customer-facing AI assistant widget", icon: "MessageCircle" },
  { id: "admin_ai_assistant", name: "Admin AI Assistant", description: "Admin panel AI chat interface", icon: "Bot" },
  { id: "ai_control_panel", name: "AI Control Panel", description: "Manual AI prompt testing", icon: "Settings2" },
  { id: "code_generation", name: "Code Generation", description: "Generate code snippets and components", icon: "Code" },
  { id: "code_fixing", name: "Code Fixing", description: "Debug and fix code issues", icon: "Wrench" },
  { id: "security_audit", name: "Security Audit", description: "Code security analysis", icon: "Shield" },
  { id: "seo_optimization", name: "SEO Optimization", description: "Meta tags, keywords, content SEO", icon: "Search" },
  { id: "content_generation", name: "Content Generation", description: "Product descriptions, marketing copy", icon: "FileText" },
  { id: "image_prompt_generation", name: "Image Prompt Generation", description: "Generate prompts for image AI", icon: "Image" },
  { id: "vision_documents", name: "Vision/Documents", description: "Analyze images and documents", icon: "Eye" },
  { id: "page_builder", name: "Page Builder", description: "AI-assisted page creation", icon: "Layout" },
  { id: "menu_builder", name: "Menu Builder", description: "AI-assisted navigation setup", icon: "Menu" },
  { id: "agentic_tasks", name: "Agentic Tasks", description: "Multi-step autonomous actions", icon: "Cpu" },
] as const;

export type AIScopeId = typeof AI_SCOPES[number]["id"];

// Canonical type mappings for backward compatibility
export const TYPE_TO_SCOPE: Record<string, AIScopeId> = {
  chat: "customer_chat",
  custom: "ai_control_panel",
  product_description: "content_generation",
  seo_meta: "seo_optimization",
  content: "content_generation",
  code_review: "security_audit",
  audit: "security_audit",
  vision: "vision_documents",
};

export interface AIScopeConfig {
  id: string;
  function_type: string;
  provider: string;
  model_id: string;
  model_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // SerpAPI tool configuration
  tools_enabled_serpapi: boolean;
  serpapi_max_calls: number;
}

export interface AIProviderConfig {
  id: string;
  provider_name: string;
  display_name: string;
  base_url: string;
  auth_type: string;
  auth_header: string | null;
  is_active: boolean;
  priority: number;
  rate_limit_per_minute: number | null;
  daily_credit_limit: number | null;
  settings: Record<string, any>;
}

// All models registry - fetched from database, with static fallback
export const MODEL_REGISTRY = {
  "1min.ai": [
    { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
    { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
    { id: "gpt-5", name: "GPT-5", provider: "OpenAI" },
    { id: "claude-sonnet-4-20250514", name: "Claude 4 Sonnet", provider: "Anthropic" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google" },
    { id: "deepseek-chat", name: "DeepSeek Chat", provider: "DeepSeek" },
  ],
  openrouter: [
    { id: "deepseek/deepseek-chat:free", name: "DeepSeek Chat", provider: "DeepSeek", free: true },
    { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1", provider: "DeepSeek", free: true },
    { id: "google/gemini-flash-1.5:free", name: "Gemini Flash 1.5", provider: "Google", free: true },
    { id: "meta-llama/llama-3.3-70b-instruct", name: "LLaMA 3.3 70B", provider: "Meta", free: true },
    { id: "qwen/qwen-2.5-32b-instruct:free", name: "Qwen 2.5 32B", provider: "Alibaba", free: true },
  ],
};

/**
 * Hook to fetch all AI scope configurations
 */
export function useAIScopeConfigs() {
  return useQuery({
    queryKey: ["ai-scope-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_model_config")
        .select("*")
        .order("function_type");

      if (error) throw error;
      return data as AIScopeConfig[];
    },
  });
}

/**
 * Hook to fetch configuration for a specific scope
 */
export function useAIScopeConfig(scopeId: AIScopeId | string) {
  return useQuery({
    queryKey: ["ai-scope-config", scopeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_model_config")
        .select("*")
        .eq("function_type", scopeId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as AIScopeConfig | null;
    },
  });
}

/**
 * Hook to fetch all active AI providers ordered by priority
 */
export function useAIProviders() {
  return useQuery({
    queryKey: ["ai-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_provider_config")
        .select("*")
        .order("priority", { ascending: true });

      if (error) throw error;
      return data as AIProviderConfig[];
    },
  });
}

/**
 * Hook to update a scope's AI configuration
 */
export function useUpdateAIScopeConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scopeId,
      provider,
      modelId,
      modelName,
    }: {
      scopeId: string;
      provider: string;
      modelId: string;
      modelName: string;
    }) => {
      const { data: existing } = await supabase
        .from("ai_model_config")
        .select("id")
        .eq("function_type", scopeId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("ai_model_config")
          .update({
            provider,
            model_id: modelId,
            model_name: modelName,
            updated_at: new Date().toISOString(),
          })
          .eq("function_type", scopeId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("ai_model_config").insert({
          function_type: scopeId,
          provider,
          model_id: modelId,
          model_name: modelName,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-scope-configs"] });
      queryClient.invalidateQueries({ queryKey: ["ai-scope-config"] });
      toast.success("AI configuration updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update configuration");
    },
  });
}

/**
 * Hook to toggle a scope on/off
 */
export function useToggleAIScope() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scopeId, isActive }: { scopeId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("ai_model_config")
        .update({ is_active: isActive })
        .eq("function_type", scopeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-scope-configs"] });
    },
  });
}

/**
 * Hook to update SerpAPI settings for a scope
 */
export function useUpdateSerpAPISettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scopeId,
      serpApiEnabled,
      maxCalls,
    }: {
      scopeId: string;
      serpApiEnabled: boolean;
      maxCalls: number;
    }) => {
      const { error } = await supabase
        .from("ai_model_config")
        .update({
          tools_enabled_serpapi: serpApiEnabled,
          serpapi_max_calls: maxCalls,
          updated_at: new Date().toISOString(),
        })
        .eq("function_type", scopeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-scope-configs"] });
      toast.success("SerpAPI settings updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update SerpAPI settings");
    },
  });
}

/**
 * Hook to update provider priority/status
 */
export function useUpdateAIProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerId,
      updates,
    }: {
      providerId: string;
      updates: Partial<AIProviderConfig>;
    }) => {
      const { error } = await supabase
        .from("ai_provider_config")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", providerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
      toast.success("Provider updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update provider");
    },
  });
}

/**
 * Get the AI gateway URL for making requests
 * Feature pages should use this to route all AI requests
 */
export function getAIGatewayUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/ai-orchestrator`;
}

/**
 * Make an AI request through the gateway
 * This is the PRIMARY and ONLY way feature pages should interact with AI
 * 
 * @param params.scope - The AI scope (from AI_SCOPES)
 * @param params.prompt - The user prompt
 * @param params.messages - Optional conversation history
 * @param params.context - Optional context data (productName, imageUrl, etc.)
 */
export interface AIDebugInfo {
  scope_used: string;
  provider_configured: string;
  provider_used: string;
  model_used: string;
  base_url_used: string;
  key_source_used: "vault" | "env";
}

export async function callAIGateway(params: {
  scope: AIScopeId | string;
  prompt: string;
  messages?: Array<{ role: string; content: string }>;
  context?: Record<string, any>;
  stream?: boolean;
}): Promise<{
  success: boolean;
  content: string;
  model: string;
  provider: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  debug?: AIDebugInfo;
}> {
  // Map legacy types to scopes
  const type = TYPE_TO_SCOPE[params.scope] || params.scope;
  
  const response = await fetch(getAIGatewayUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      prompt: params.prompt,
      messages: params.messages,
      context: params.context,
      stream: params.stream,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "AI request failed");
  }

  const data = await response.json();
  return {
    success: true,
    content: data.content,
    model: data.model,
    provider: data.provider,
    usage: data.usage,
    debug: data.debug,
  };
}

/**
 * Call SerpAPI through the shared gateway
 */
export async function callSerpAPI(params: {
  endpoint: "search" | "images" | "places" | "shopping";
  query: string;
  scope?: AIScopeId | string;
  options?: {
    location?: string;
    num?: number;
    gl?: string;
    hl?: string;
  };
}): Promise<{
  success: boolean;
  data: any;
  cached: boolean;
  remaining: number;
}> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  const response = await fetch(`${supabaseUrl}/functions/v1/serpapi-gateway`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "SerpAPI request failed");
  }

  return response.json();
}
