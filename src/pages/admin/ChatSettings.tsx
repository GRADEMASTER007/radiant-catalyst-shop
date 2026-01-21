import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Settings, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  RefreshCw,
  Bot,
  Sparkles,
  Info
} from "lucide-react";

// Available 1min.AI models for chat
const AVAILABLE_MODELS = [
  // OpenAI - Most Popular
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", recommended: true },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5", provider: "OpenAI" },
  { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "OpenAI" },
  { id: "gpt-5", name: "GPT-5", provider: "OpenAI" },
  // Anthropic
  { id: "claude-sonnet-4-20250514", name: "Claude 4 Sonnet", provider: "Anthropic" },
  { id: "claude-haiku-4-5-20251001", name: "Claude 4.5 Haiku", provider: "Anthropic" },
  // Google
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google" },
  { id: "gemini-3-pro-preview", name: "Gemini 3 Pro", provider: "Google" },
  // DeepSeek
  { id: "deepseek-chat", name: "DeepSeek V3.2 Chat", provider: "DeepSeek" },
  { id: "deepseek-reasoner", name: "DeepSeek V3.2 Reasoner", provider: "DeepSeek" },
  // Mistral
  { id: "mistral-large-latest", name: "Mistral Large 2", provider: "Mistral" },
  { id: "mistral-small-latest", name: "Mistral Small", provider: "Mistral" },
  // xAI
  { id: "grok-3", name: "Grok 3", provider: "xAI" },
  { id: "grok-3-mini", name: "Grok 3 Mini", provider: "xAI" },
  // Meta
  { id: "meta/meta-llama-3.1-405b-instruct", name: "LLaMA 3.1 405B", provider: "Meta" },
  { id: "meta/llama-4-maverick-instruct", name: "LLaMA 4 Maverick", provider: "Meta" },
  // Alibaba
  { id: "qwen3-max", name: "Qwen3 Max", provider: "Alibaba" },
  { id: "qwen-plus", name: "Qwen Plus", provider: "Alibaba" },
];

interface ChatConfig {
  id: string;
  provider_name: string;
  selected_model: string;
  is_active: boolean;
  settings: Record<string, any>;
  feature_scope: string[];
  created_at: string;
  updated_at: string;
}

export default function ChatSettings() {
  const queryClient = useQueryClient();
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");

  // Fetch chat configuration
  const { data: config, isLoading } = useQuery({
    queryKey: ["chat-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_provider_config")
        .select("*")
        .eq("provider_name", "1min.ai")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data as ChatConfig | null;
    },
  });

  // Create or update config mutation
  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<ChatConfig>) => {
      if (config?.id) {
        const { error } = await supabase
          .from("chat_provider_config")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("chat_provider_config")
          .insert({
            provider_name: "1min.ai",
            selected_model: updates.selected_model || "gpt-4o-mini",
            is_active: updates.is_active ?? true,
            feature_scope: ["chat", "customer-support"],
            settings: {},
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-config"] });
      toast.success("Chat settings updated");
    },
    onError: (error: any) => {
      toast.error("Failed to update settings: " + error.message);
    },
  });

  // Test connection
  const testConnection = async () => {
    setTestStatus("testing");
    setTestMessage("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onemin-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Hello, this is a test message." }],
            action: "test",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Connection test failed");
      }

      // Read a bit of the stream to verify it works
      const reader = response.body?.getReader();
      if (reader) {
        const { value } = await reader.read();
        if (value) {
          setTestStatus("success");
          setTestMessage("Connection successful! Chat is working.");
          reader.cancel();
        }
      }
    } catch (error: any) {
      setTestStatus("error");
      setTestMessage(error.message || "Connection failed");
    }
  };

  const currentModel = config?.selected_model || "gpt-4o-mini";
  const isActive = config?.is_active ?? true;
  const modelInfo = AVAILABLE_MODELS.find((m) => m.id === currentModel);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-primary" />
            Chat Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure 1min.AI for customer chat and support features
          </p>
        </div>
        <Badge variant={isActive ? "default" : "secondary"} className="text-sm">
          {isActive ? "Active" : "Disabled"}
        </Badge>
      </div>

      {/* Info Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-4 p-4">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Dedicated Chat Provider</p>
            <p className="text-muted-foreground">
              1min.AI is used exclusively for chat and customer support features. 
              Other AI features (admin panel, image generation, SEO) use OpenRouter and Kilocode.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Provider Configuration
            </CardTitle>
            <CardDescription>
              Configure the 1min.AI chat integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="chat-active">Enable Chat</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle chat feature across all pages
                </p>
              </div>
              <Switch
                id="chat-active"
                checked={isActive}
                onCheckedChange={(checked) => updateConfig.mutate({ is_active: checked })}
              />
            </div>

            <Separator />

            {/* Model Selection */}
            <div className="space-y-3">
              <Label>Chat Model</Label>
              <Select
                value={currentModel}
                onValueChange={(value) => updateConfig.mutate({ selected_model: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(
                    AVAILABLE_MODELS.reduce((acc, model) => {
                      if (!acc[model.provider]) acc[model.provider] = [];
                      acc[model.provider].push(model);
                      return acc;
                    }, {} as Record<string, typeof AVAILABLE_MODELS>)
                  ).map(([provider, models]) => (
                    <div key={provider}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {provider}
                      </div>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            {model.name}
                            {model.recommended && (
                              <Badge variant="outline" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {modelInfo && (
                <p className="text-xs text-muted-foreground">
                  Provider: {modelInfo.provider}
                </p>
              )}
            </div>

            <Separator />

            {/* Feature Scope */}
            <div className="space-y-2">
              <Label>Feature Scope</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Chat Widget
                </Badge>
                <Badge variant="secondary">
                  <Bot className="h-3 w-3 mr-1" />
                  Customer Support
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                1min.AI is scoped to chat features only
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Connection Status
            </CardTitle>
            <CardDescription>
              Test the 1min.AI API connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Status</span>
                <AnimatePresence mode="wait">
                  {testStatus === "idle" && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-muted-foreground"
                    >
                      Not tested
                    </motion.span>
                  )}
                  {testStatus === "testing" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Testing...</span>
                    </motion.div>
                  )}
                  {testStatus === "success" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-green-600"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">Connected</span>
                    </motion.div>
                  )}
                  {testStatus === "error" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-destructive"
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm">Failed</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {testMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm ${
                    testStatus === "success" ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {testMessage}
                </motion.p>
              )}

              <Button
                onClick={testConnection}
                disabled={testStatus === "testing"}
                className="w-full"
                variant="outline"
              >
                {testStatus === "testing" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>

            {/* Current Config Summary */}
            <div className="space-y-2">
              <Label>Current Configuration</Label>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>Provider: <span className="text-foreground">1min.AI</span></p>
                <p>Model: <span className="text-foreground">{modelInfo?.name || currentModel}</span></p>
                <p>Status: <span className={isActive ? "text-green-600" : "text-destructive"}>
                  {isActive ? "Active" : "Disabled"}
                </span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Available Models
          </CardTitle>
          <CardDescription>
            All 1min.AI models available for chat features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_MODELS.map((model) => (
              <div
                key={model.id}
                className={`p-3 rounded-lg border ${
                  model.id === currentModel
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{model.name}</span>
                  {model.recommended && (
                    <Badge variant="outline" className="text-xs">
                      ⭐
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{model.provider}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
