/**
 * AI Configuration Layer Hook
 * 
 * This hook provides access to the AI configuration layer, serving as the
 * single source of truth for AI behavior across the application.
 * 
 * Architecture Layer: AI Configuration (Layer 2)
 * - Assigns AI providers to functional scopes
 * - Defines which models are used per scope
 * - Allows model/provider changes without code rewrites
 * - References keys stored in the API Key Vault (Layer 1)
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
export function useAIScopeConfig(scopeId: AIScopeId) {
  return useQuery({
    queryKey: ["ai-scope-config", scopeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_model_config")
        .select("*")
        .eq("function_type", scopeId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // Ignore not found
      return data as AIScopeConfig | null;
    },
  });
}

/**
 * Hook to fetch all active AI providers
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
      // Check if config exists
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
 * This is the primary way feature pages should interact with AI
 */
export async function callAIGateway(params: {
  scope: AIScopeId;
  prompt: string;
  messages?: Array<{ role: string; content: string }>;
  context?: Record<string, any>;
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
}> {
  const response = await fetch(getAIGatewayUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: params.scope,
      prompt: params.prompt,
      messages: params.messages,
      context: params.context,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "AI request failed");
  }

  return response.json();
}
