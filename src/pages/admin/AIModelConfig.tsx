import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Bot,
  Code,
  Brain,
  Zap,
  Shield,
  Globe,
  FileText,
  Eye,
  MessageCircle,
  Sparkles,
  RefreshCw,
  Save,
  Loader2,
  CheckCircle,
  Settings2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// All available models from both providers
const ALL_MODELS = {
  kilocode: {
    name: "KiloCode",
    color: "text-purple-500",
    models: [
      { id: "qwen/qwen3-coder", name: "Qwen3 Coder", description: "Agentic coding, function calling, tool use" },
      { id: "deepseek/deepseek-r1-0528:free", name: "DeepSeek R1", description: "O1-level open reasoning" },
      { id: "moonshotai/kimi-k2:free", name: "Kimi K2", description: "Advanced tool use, reasoning" },
      { id: "zhipu-ai/glm-4.5-air:free", name: "GLM 4.5 Air", description: "Lightweight agent tasks" },
    ],
  },
  openrouter: {
    name: "OpenRouter",
    color: "text-blue-500",
    models: [
      { id: "google/gemma-3-12b:free", name: "Google Gemma 3 12B", description: "Fast lightweight tasks" },
      { id: "google/gemma-3-27b:free", name: "Google Gemma 3 27B", description: "Better quality, still fast" },
      { id: "google/gemini-2.0-flash-experimental:free", name: "Gemini 2.0 Flash", description: "Experimental, multimodal" },
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", description: "Great all-rounder (131K)" },
      { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Llama 3.2 3B", description: "Ultra-fast, small tasks" },
      { id: "meta-llama/llama-3.1-405b-instruct:free", name: "Llama 3.1 405B", description: "Best for audits & complex tasks" },
      { id: "qwen/qwen-2.5-vl-7b-instruct:free", name: "Qwen 2.5 VL 7B", description: "Vision/image analysis" },
      { id: "nousresearch/hermes-3-405b-instruct:free", name: "Hermes 3 405B", description: "Best for chat & content" },
    ],
  },
};

// Function types with icons
const FUNCTION_TYPES = [
  { type: "chat", name: "Customer Chat", icon: MessageCircle, description: "Customer-facing AI assistant" },
  { type: "coding", name: "Code Generation", icon: Code, description: "Code generation and review" },
  { type: "reasoning", name: "Complex Reasoning", icon: Brain, description: "Multi-step reasoning tasks" },
  { type: "agent", name: "Agentic Tasks", icon: Bot, description: "Tool use and autonomous actions" },
  { type: "fast", name: "Quick Tasks", icon: Zap, description: "Lightweight, fast responses" },
  { type: "audit", name: "Security Audit", icon: Shield, description: "Code security analysis" },
  { type: "seo", name: "SEO Optimization", icon: Globe, description: "Meta tags and keywords" },
  { type: "content", name: "Content Generation", icon: FileText, description: "Product descriptions, marketing" },
  { type: "vision", name: "Vision/Documents", icon: Eye, description: "Image and document analysis" },
];

interface ModelConfig {
  id: string;
  function_type: string;
  provider: string;
  model_id: string;
  model_name: string;
  description: string;
  is_active: boolean;
}

export default function AIModelConfig() {
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, { provider: string; model_id: string; model_name: string }>>({});

  // Fetch current config
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["ai-model-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_model_config")
        .select("*")
        .order("function_type");

      if (error) throw error;
      return data as ModelConfig[];
    },
  });

  // Update config mutation
  const updateMutation = useMutation({
    mutationFn: async ({ functionType, provider, modelId, modelName }: { functionType: string; provider: string; modelId: string; modelName: string }) => {
      const { error } = await supabase
        .from("ai_model_config")
        .update({ provider, model_id: modelId, model_name: modelName, updated_at: new Date().toISOString() })
        .eq("function_type", functionType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-model-config"] });
      toast.success("Model configuration updated!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update configuration");
    },
  });

  // Toggle active status
  const toggleMutation = useMutation({
    mutationFn: async ({ functionType, isActive }: { functionType: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("ai_model_config")
        .update({ is_active: isActive })
        .eq("function_type", functionType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-model-config"] });
    },
  });

  const handleModelChange = (functionType: string, provider: string, modelId: string) => {
    const allModels = [...ALL_MODELS.kilocode.models, ...ALL_MODELS.openrouter.models];
    const model = allModels.find(m => m.id === modelId);
    
    setPendingChanges(prev => ({
      ...prev,
      [functionType]: { provider, model_id: modelId, model_name: model?.name || modelId },
    }));
  };

  const saveChange = async (functionType: string) => {
    const change = pendingChanges[functionType];
    if (!change) return;

    await updateMutation.mutateAsync({
      functionType,
      provider: change.provider,
      modelId: change.model_id,
      modelName: change.model_name,
    });

    setPendingChanges(prev => {
      const next = { ...prev };
      delete next[functionType];
      return next;
    });
  };

  const saveAllChanges = async () => {
    for (const functionType of Object.keys(pendingChanges)) {
      await saveChange(functionType);
    }
  };

  const getConfigForType = (type: string) => {
    return configs.find(c => c.function_type === type);
  };

  const getCurrentSelection = (type: string) => {
    const pending = pendingChanges[type];
    if (pending) return pending;
    
    const config = getConfigForType(type);
    if (config) {
      return { provider: config.provider, model_id: config.model_id, model_name: config.model_name };
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-primary" />
            AI Model Configuration
          </h1>
          <p className="text-muted-foreground mt-1">
            Select which AI models to use for each function from KiloCode and OpenRouter
          </p>
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(pendingChanges).length > 0 && (
            <Badge variant="secondary" className="animate-pulse">
              {Object.keys(pendingChanges).length} unsaved changes
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["ai-model-config"] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {Object.keys(pendingChanges).length > 0 && (
            <Button onClick={saveAllChanges} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save All
            </Button>
          )}
        </div>
      </div>

      {/* Provider Legend */}
      <div className="flex items-center gap-6 p-4 rounded-lg bg-muted/50">
        <span className="text-sm font-medium">Providers:</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
            KiloCode
          </Badge>
          <span className="text-xs text-muted-foreground">{ALL_MODELS.kilocode.models.length} models</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
            OpenRouter
          </Badge>
          <span className="text-xs text-muted-foreground">{ALL_MODELS.openrouter.models.length} models</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {FUNCTION_TYPES.map((func, index) => {
              const config = getConfigForType(func.type);
              const current = getCurrentSelection(func.type);
              const hasPending = !!pendingChanges[func.type];
              const Icon = func.icon;

              return (
                <motion.div
                  key={func.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`relative overflow-hidden transition-all ${hasPending ? "ring-2 ring-primary/50" : ""}`}>
                    {hasPending && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-primary animate-pulse" />
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{func.name}</CardTitle>
                            <CardDescription className="text-xs">{func.description}</CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={config?.is_active ?? true}
                          onCheckedChange={(checked) => toggleMutation.mutate({ functionType: func.type, isActive: checked })}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Provider Selection */}
                      <div className="space-y-2">
                        <Label className="text-xs">Provider</Label>
                        <Select
                          value={current?.provider || "openrouter"}
                          onValueChange={(provider) => {
                            const firstModel = ALL_MODELS[provider as keyof typeof ALL_MODELS].models[0];
                            handleModelChange(func.type, provider, firstModel.id);
                          }}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kilocode">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                KiloCode
                              </span>
                            </SelectItem>
                            <SelectItem value="openrouter">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                OpenRouter
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Model Selection */}
                      <div className="space-y-2">
                        <Label className="text-xs">Model</Label>
                        <Select
                          value={current?.model_id || ""}
                          onValueChange={(modelId) => {
                            const provider = current?.provider || "openrouter";
                            handleModelChange(func.type, provider, modelId);
                          }}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select model..." />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_MODELS[current?.provider as keyof typeof ALL_MODELS || "openrouter"].models.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{model.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground truncate">
                          {ALL_MODELS[current?.provider as keyof typeof ALL_MODELS || "openrouter"].models.find(m => m.id === current?.model_id)?.description || "Select a model"}
                        </p>
                      </div>

                      {/* Save Button */}
                      {hasPending && (
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => saveChange(func.type)}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3 mr-2" />
                          )}
                          Save
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Model Reference */}
      <Separator className="my-8" />
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Available Models Reference
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* KiloCode Models */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                KiloCode Models
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ALL_MODELS.kilocode.models.map((model) => (
                <div key={model.id} className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">{model.name}</p>
                  <p className="text-xs text-muted-foreground">{model.description}</p>
                  <code className="text-[10px] text-muted-foreground mt-1 block">{model.id}</code>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* OpenRouter Models */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                OpenRouter Models
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {ALL_MODELS.openrouter.models.map((model) => (
                <div key={model.id} className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">{model.name}</p>
                  <p className="text-xs text-muted-foreground">{model.description}</p>
                  <code className="text-[10px] text-muted-foreground mt-1 block">{model.id}</code>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
