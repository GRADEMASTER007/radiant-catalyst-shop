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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// AI Providers and their models
const AI_PROVIDERS = {
  openrouter: {
    name: "OpenRouter",
    icon: Zap,
    models: [
      { id: "deepseek/deepseek-r1-0528:free", name: "DeepSeek R1 (Reasoning)", description: "Best for complex analysis and audits" },
      { id: "qwen/qwen3-coder:free", name: "Qwen3 Coder", description: "Optimized for coding tasks" },
      { id: "moonshotai/kimi-k2:free", name: "Kimi K2 (Agent)", description: "Advanced tool use and reasoning" },
      { id: "zhipu-ai/glm-4.5-air:free", name: "GLM 4.5 Air", description: "Fast lightweight responses" },
      { id: "nousresearch/hermes-3-llama-3.1-405b:free", name: "Hermes 3 405B", description: "General purpose" },
      { id: "meta-llama/llama-3.1-405b-instruct:free", name: "Llama 3.1 405B", description: "Meta's flagship" },
    ],
  },
  lovable: {
    name: "Lovable AI",
    icon: Sparkles,
    models: [
      { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", description: "Fast and capable" },
      { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Top-tier reasoning" },
      { id: "openai/gpt-5-mini", name: "GPT-5 Mini", description: "Balanced performance" },
    ],
  },
};

// Prompt templates for common tasks
const PROMPT_TEMPLATES = [
  {
    id: "add-page",
    label: "Add New Page",
    icon: Layout,
    template: `Create a new page for the Dragon Fruit SA website with the following specifications:

Page Name: [PAGE_NAME]
URL Path: /[page-slug]
Purpose: [DESCRIBE PURPOSE]

Content Requirements:
- Hero section with [DESCRIBE HERO]
- Main content sections: [LIST SECTIONS]
- Call-to-action: [DESCRIBE CTA]
- SEO: Include meta title, description, and keywords

Design: Match existing site style with African/agricultural theme.`,
  },
  {
    id: "add-blog",
    label: "Create Blog Post",
    icon: PenTool,
    template: `Write a blog post for Dragon Fruit SA about:

Topic: [TOPIC]
Target Audience: [AUDIENCE]
Keywords: [KEYWORDS]

Structure:
- Engaging headline
- Introduction (hook the reader)
- 3-5 main sections with H2 headings
- Practical tips or takeaways
- Conclusion with CTA

Tone: Professional yet friendly, knowledgeable about dragon fruit farming.
Length: 800-1200 words.`,
  },
  {
    id: "add-menu",
    label: "Add Menu Item",
    icon: Menu,
    template: `Add a new navigation menu item:

Menu Label: [LABEL]
Link To: [URL or PAGE]
Position: [WHERE IN MENU]
Dropdown Items (if any): [LIST ITEMS]

Also update mobile navigation to include this item.`,
  },
  {
    id: "add-feature",
    label: "Add Feature",
    icon: Zap,
    template: `Implement a new feature for the Dragon Fruit SA website:

Feature Name: [FEATURE_NAME]
Description: [DETAILED DESCRIPTION]
User Story: As a [USER], I want to [ACTION] so that [BENEFIT]

Technical Requirements:
- Frontend: [DESCRIBE UI]
- Backend: [DESCRIBE API/DB NEEDS]
- Integrations: [ANY EXTERNAL SERVICES]

Acceptance Criteria:
1. [CRITERION 1]
2. [CRITERION 2]
3. [CRITERION 3]`,
  },
  {
    id: "seo-update",
    label: "SEO Optimization",
    icon: FileText,
    template: `Optimize SEO for the following page/content:

Page/Product: [NAME]
Current URL: [URL]

Generate optimized:
1. Meta Title (under 60 chars)
2. Meta Description (under 160 chars)
3. Primary Keywords (3-5)
4. Secondary Keywords (5-10)
5. Open Graph tags
6. Schema markup suggestions

Focus on: Dragon fruit, South Africa, farming, cultivation, export.`,
  },
  {
    id: "add-images",
    label: "Image Requirements",
    icon: Image,
    template: `Generate image requirements for:

Purpose: [WHERE IMAGES WILL BE USED]
Quantity: [NUMBER OF IMAGES]

For each image specify:
- Description/subject matter
- Recommended dimensions
- Alt text for accessibility
- File naming convention

Theme: Dragon fruit farming in Africa, vibrant colors, professional agricultural imagery.`,
  },
];

interface AIResponse {
  success: boolean;
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export default function AIControlPanel() {
  const [provider, setProvider] = useState<keyof typeof AI_PROVIDERS>("openrouter");
  const [model, setModel] = useState(AI_PROVIDERS.openrouter.models[0].id);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const aiMutation = useMutation({
    mutationFn: async ({ prompt, model }: { prompt: string; model: string }): Promise<AIResponse> => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/kilo-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "custom",
          prompt,
          model,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "AI request failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResponse(data.content);
      toast.success("AI Response Generated", {
        description: `Used ${data.model}`,
      });
    },
    onError: (error: Error) => {
      toast.error("AI Request Failed", { description: error.message });
    },
  });

  const handleProviderChange = (newProvider: keyof typeof AI_PROVIDERS) => {
    setProvider(newProvider);
    setModel(AI_PROVIDERS[newProvider].models[0].id);
  };

  const applyTemplate = (templateId: string) => {
    const template = PROMPT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setPrompt(template.template);
      setActiveTemplate(templateId);
    }
  };

  const sendPrompt = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    aiMutation.mutate({ prompt, model });
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      toast.success("Response copied to clipboard");
    }
  };

  const ProviderIcon = AI_PROVIDERS[provider].icon;

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
        <Badge variant="outline" className="gap-2 self-start md:self-auto">
          <ProviderIcon className="h-4 w-4" />
          {AI_PROVIDERS[provider].name}
        </Badge>
      </div>

      {/* Provider & Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            AI Configuration
          </CardTitle>
          <CardDescription>Select your AI provider and model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(v) => handleProviderChange(v as keyof typeof AI_PROVIDERS)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AI_PROVIDERS).map(([key, prov]) => {
                    const Icon = prov.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {prov.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS[provider].models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex flex-col">
                        <span>{m.name}</span>
                        <span className="text-xs text-muted-foreground">{m.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              Enter your prompt (up to 1000+ words). Be specific about what you want.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe what you want to create, add, or modify on the website...

Examples:
• Create a new 'Varieties' page showcasing our dragon fruit cultivars
• Write a blog post about dragon fruit health benefits
• Add a customer testimonials section to the homepage
• Generate SEO metadata for all product pages
• Add a FAQ section about ordering and shipping"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {prompt.length} characters / ~{Math.ceil(prompt.split(/\s+/).filter(Boolean).length)} words
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
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20"
                >
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    <Brain className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="mt-4 text-muted-foreground">AI is thinking...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Using {AI_PROVIDERS[provider].models.find((m) => m.id === model)?.name}
                  </p>
                </motion.div>
              ) : response ? (
                <motion.div
                  key="response"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ScrollArea className="h-[500px] rounded-lg border bg-muted/30 p-4">
                    <pre className="text-sm whitespace-pre-wrap font-mono">{response}</pre>
                  </ScrollArea>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-muted-foreground"
                >
                  <Code className="h-12 w-12 mb-4 opacity-50" />
                  <p>AI response will appear here</p>
                  <p className="text-xs mt-1">Select a template or write your own prompt</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Better Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Layout className="h-4 w-4 text-primary" />
                For New Pages
              </h4>
              <p className="text-sm text-muted-foreground">
                Specify the page structure, sections, and content you want. Include SEO requirements.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <PenTool className="h-4 w-4 text-primary" />
                For Blog Posts
              </h4>
              <p className="text-sm text-muted-foreground">
                Include target keywords, audience, and desired length. Mention any specific points to cover.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                For Features
              </h4>
              <p className="text-sm text-muted-foreground">
                Describe the user journey, technical requirements, and acceptance criteria clearly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
