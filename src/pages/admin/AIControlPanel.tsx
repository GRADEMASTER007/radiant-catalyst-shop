import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Loader2,
  Send,
  Copy,
  RefreshCw,
  Settings2,
  Sparkles,
  Code,
  FileText,
  Image,
  Layout,
  Menu,
  PenTool,
  Zap,
  Brain,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  callAIGateway, 
  useAIScopeConfigs, 
  useAIProviders, 
  AI_SCOPES,
  type AIScopeId,
} from "@/hooks/use-ai-config";

// Prompt templates for common tasks - maps to AI scopes
const PROMPT_TEMPLATES = [
  {
    id: "add-page",
    label: "Add New Page",
    icon: Layout,
    scope: "page_builder" as AIScopeId,
    template: `Create a new page for the Dragon Fruit SA website with the following specifications:

Page Name: [PAGE_NAME]
URL Path: /[page-slug]
Purpose: [DESCRIBE PURPOSE]

Design: Match existing site style with African/agricultural theme.`,
  },
  {
    id: "add-blog",
    label: "Create Blog Post",
    icon: PenTool,
    scope: "content_generation" as AIScopeId,
    template: `Write a blog post for Dragon Fruit SA about:

Topic: [TOPIC]
Target Audience: [AUDIENCE]
Keywords: [KEYWORDS]

Tone: Professional yet friendly.
Length: 800-1200 words.`,
  },
  {
    id: "add-menu",
    label: "Add Menu Item",
    icon: Menu,
    scope: "menu_builder" as AIScopeId,
    template: `Add a new navigation menu item:

Menu Label: [LABEL]
Link To: [URL or PAGE]
Position: [WHERE IN MENU]`,
  },
  {
    id: "seo-update",
    label: "SEO Optimization",
    icon: FileText,
    scope: "seo_optimization" as AIScopeId,
    template: `Optimize SEO for the following page/content:

Page/Product: [NAME]
Current URL: [URL]

Generate optimized title, description, and keywords.`,
  },
  {
    id: "add-images",
    label: "Image Prompt",
    icon: Image,
    scope: "image_prompt_generation" as AIScopeId,
    template: `Generate image requirements for:

Purpose: [WHERE IMAGES WILL BE USED]

Theme: Dragon fruit farming in Africa, vibrant colors, professional agricultural imagery.`,
  },
  {
    id: "code-help",
    label: "Code Help",
    icon: Code,
    scope: "code_generation" as AIScopeId,
    template: `Help me with the following code task:

Task: [DESCRIBE WHAT YOU NEED]
Technology: React/TypeScript/Tailwind`,
  },
];

interface AIResponse {
  success: boolean;
  content: string;
  model: string;
  provider: string;
}

export default function AIControlPanel() {
  const [selectedScope, setSelectedScope] = useState<AIScopeId>("ai_control_panel");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  // Get configs from database - NO hardcoded providers/models
  const { data: scopeConfigs } = useAIScopeConfigs();
  const { data: providers } = useAIProviders();

  // Get current config for selected scope
  const currentConfig = scopeConfigs?.find(c => c.function_type === selectedScope);
  const activeProviders = providers?.filter(p => p.is_active) || [];

  const aiMutation = useMutation({
    mutationFn: async ({ prompt, scope }: { prompt: string; scope: AIScopeId }): Promise<AIResponse> => {
      // Route through unified gateway
      return callAIGateway({
        scope,
        prompt,
      });
    },
    onSuccess: (data) => {
      setResponse(data);
      toast.success("AI Response Generated", {
        description: `${data.provider}/${data.model}`,
      });
    },
    onError: (error: Error) => {
      toast.error("AI Request Failed", { description: error.message });
    },
  });

  const applyTemplate = (templateId: string) => {
    const template = PROMPT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setPrompt(template.template);
      setSelectedScope(template.scope);
      setActiveTemplate(templateId);
    }
  };

  const sendPrompt = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    aiMutation.mutate({ prompt, scope: selectedScope });
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response.content);
      toast.success("Response copied to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            AI Control Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Use AI to generate content, add pages, create blog posts, and manage site features
          </p>
        </div>
        {currentConfig && (
          <Badge variant="outline" className="gap-2 self-start md:self-auto">
            <Sparkles className="h-4 w-4" />
            {currentConfig.provider}/{currentConfig.model_name}
          </Badge>
        )}
      </div>

      {/* Scope Selection - from database */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            AI Configuration
          </CardTitle>
          <CardDescription>
            Select the AI scope for your task. Provider and model are configured in AI Configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Scope</label>
              <Select value={selectedScope} onValueChange={(v) => setSelectedScope(v as AIScopeId)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_SCOPES.map((scope) => (
                    <SelectItem key={scope.id} value={scope.id}>
                      <div className="flex flex-col">
                        <span>{scope.name}</span>
                        <span className="text-xs text-muted-foreground">{scope.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Active Providers</label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                {activeProviders.map((provider) => (
                  <Badge key={provider.id} variant="secondary">
                    {provider.display_name} (#{provider.priority})
                  </Badge>
                ))}
                {activeProviders.length === 0 && (
                  <span className="text-sm text-muted-foreground">No active providers</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Quick Templates
          </CardTitle>
          <CardDescription>
            Click a template to populate the prompt with a structured format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PROMPT_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant={activeTemplate === template.id ? "default" : "outline"}
                className="h-auto py-4 flex-col gap-2"
                onClick={() => applyTemplate(template.id)}
              >
                <template.icon className="h-5 w-5" />
                <span className="text-xs text-center">{template.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Prompt Area */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Prompt Input
            </CardTitle>
            <CardDescription>
              Enter your prompt. Be specific about what you want.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe what you want to create, add, or modify..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {prompt.length} characters
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPrompt("");
                    setActiveTemplate(null);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button onClick={sendPrompt} disabled={aiMutation.isPending}>
                  {aiMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Output */}
        <Card className="lg:row-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Response
              </CardTitle>
              <CardDescription>Generated content and instructions</CardDescription>
            </div>
            {response && (
              <Button variant="outline" size="sm" onClick={copyResponse}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {aiMutation.isPending ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[400px] flex flex-col items-center justify-center"
                >
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">Generating response...</p>
                </motion.div>
              ) : response ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{response.provider}</Badge>
                    <Badge variant="secondary">{response.model}</Badge>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <pre className="whitespace-pre-wrap text-sm p-4 rounded-lg bg-muted">
                      {response.content}
                    </pre>
                  </ScrollArea>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-[400px] flex flex-col items-center justify-center text-muted-foreground"
                >
                  <Wand2 className="h-12 w-12 mb-4 opacity-30" />
                  <p>Enter a prompt and click Generate</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
