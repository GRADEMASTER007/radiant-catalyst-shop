/**
 * AI Diagnostics Page
 * 
 * Production readiness checks for AI system:
 * - Environment mode detection (preview vs production)
 * - Server-side test calls through ai-orchestrator
 * - Clear error messages for missing secrets
 * - Never displays secret values
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Server, 
  Key, 
  Zap,
  Search,
  Globe
} from "lucide-react";
import { motion } from "framer-motion";

interface DiagnosticResult {
  provider: string;
  status: "success" | "error" | "warning" | "pending";
  message: string;
  responseTime?: number;
  model?: string;
}

interface ProviderStatus {
  provider_name: string;
  display_name: string;
  is_active: boolean;
  priority: number;
}

export default function AIDiagnostics() {
  const [testResults, setTestResults] = useState<DiagnosticResult[]>([]);
  const [testing, setTesting] = useState<string | null>(null);

  // Detect environment
  const isProduction = window.location.hostname === "dragonfruitfarmingafrica.lovable.app";
  const isPreview = window.location.hostname.includes("preview--");
  const environmentMode = isProduction ? "Production" : isPreview ? "Preview" : "Development";

  // Fetch active providers
  const { data: providers, isLoading: loadingProviders } = useQuery({
    queryKey: ["ai-providers-diagnostic"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_provider_config")
        .select("provider_name, display_name, is_active, priority")
        .order("priority", { ascending: true });
      
      if (error) throw error;
      return data as ProviderStatus[];
    },
  });

  // Test a specific provider
  const testProvider = async (providerName: string) => {
    setTesting(providerName);
    const startTime = Date.now();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-orchestrator`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "ai_control_panel",
            prompt: "Respond with exactly: DIAGNOSTIC_OK",
            testMode: true,
            forceProvider: providerName,
          }),
        }
      );

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        setTestResults((prev) => [
          ...prev.filter((r) => r.provider !== providerName),
          {
            provider: providerName,
            status: "error",
            message: data.error || "Request failed",
            responseTime,
          },
        ]);
      } else {
        setTestResults((prev) => [
          ...prev.filter((r) => r.provider !== providerName),
          {
            provider: providerName,
            status: "success",
            message: "Connection successful",
            responseTime,
            model: data.model,
          },
        ]);
      }
    } catch (error: any) {
      setTestResults((prev) => [
        ...prev.filter((r) => r.provider !== providerName),
        {
          provider: providerName,
          status: "error",
          message: error.message || "Network error",
        },
      ]);
    } finally {
      setTesting(null);
    }
  };

  // Test SerpAPI
  const testSerpAPI = async () => {
    setTesting("serpapi");
    const startTime = Date.now();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/serpapi-gateway`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: "search",
            query: "test",
            testMode: true,
          }),
        }
      );

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        setTestResults((prev) => [
          ...prev.filter((r) => r.provider !== "serpapi"),
          {
            provider: "serpapi",
            status: "error",
            message: data.error || "SerpAPI request failed",
            responseTime,
          },
        ]);
      } else {
        setTestResults((prev) => [
          ...prev.filter((r) => r.provider !== "serpapi"),
          {
            provider: "serpapi",
            status: "success",
            message: data.cached ? "Connection successful (cached)" : "Connection successful",
            responseTime,
          },
        ]);
      }
    } catch (error: any) {
      setTestResults((prev) => [
        ...prev.filter((r) => r.provider !== "serpapi"),
        {
          provider: "serpapi",
          status: "error",
          message: error.message || "Network error",
        },
      ]);
    } finally {
      setTesting(null);
    }
  };

  const getResultForProvider = (providerName: string) => {
    return testResults.find((r) => r.provider === providerName);
  };

  const StatusIcon = ({ status }: { status?: string }) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case "error":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-accent-foreground" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Diagnostics</h1>
          <p className="text-muted-foreground">
            Production readiness checks for AI system
          </p>
        </div>
        <Badge 
          variant={isProduction ? "default" : "secondary"}
          className="text-sm px-3 py-1"
        >
          <Globe className="h-4 w-4 mr-1" />
          {environmentMode}
        </Badge>
      </div>

      {/* Environment Alert */}
      <Alert variant={isProduction ? "default" : "destructive"}>
        <Server className="h-4 w-4" />
        <AlertTitle>Environment: {environmentMode}</AlertTitle>
        <AlertDescription>
          {isProduction ? (
            <>
              Running in production mode. Secrets must be configured in{" "}
              <strong>Lovable Cloud Edge Function Secrets</strong> for AI to work.
            </>
          ) : (
            <>
              Running in {environmentMode.toLowerCase()} mode. Secrets are read from
              environment variables or the API Key Vault database table.
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Secrets Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Secrets Configuration
          </CardTitle>
          <CardDescription>
            Where to configure API keys for published site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Option 1: Lovable Cloud Secrets</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Go to <strong>Settings → Secrets</strong> in Lovable and add:
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded block">
                OPENROUTER_API_KEY
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Edge functions will automatically use these secrets.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Option 2: API Key Vault (Database)</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Add keys via <strong>Admin → API Key Vault</strong> with:
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded block">
                key_name: OPENROUTER_API_KEY<br/>
                service_type: ai_provider
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Vault takes priority over environment secrets.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Provider Connectivity
          </CardTitle>
          <CardDescription>
            Test AI provider connections (never displays secret values)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProviders ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {providers?.map((provider) => {
                const result = getResultForProvider(provider.provider_name);
                const isTesting = testing === provider.provider_name;

                return (
                  <motion.div
                    key={provider.provider_name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <StatusIcon status={result?.status} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{provider.display_name}</span>
                          <Badge variant={provider.is_active ? "default" : "secondary"}>
                            {provider.is_active ? "Active" : "Disabled"}
                          </Badge>
                          <Badge variant="outline">Priority {provider.priority}</Badge>
                        </div>
                    {result && (
                          <p className={`text-sm ${result.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                            {result.message}
                            {result.responseTime !== undefined && ` (${result.responseTime}ms)`}
                            {result.model && ` • Model: ${result.model}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testProvider(provider.provider_name)}
                      disabled={isTesting || !provider.is_active}
                    >
                      {isTesting ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        "Test"
                      )}
                    </Button>
                  </motion.div>
                );
              })}

              <Separator className="my-4" />

              {/* SerpAPI Test */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <StatusIcon status={getResultForProvider("serpapi")?.status} />
                  <div>
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      <span className="font-medium">SerpAPI</span>
                      <Badge variant="secondary">Search Tool</Badge>
                    </div>
                    {getResultForProvider("serpapi") && (
                      <p className={`text-sm ${getResultForProvider("serpapi")?.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                        {getResultForProvider("serpapi")?.message}
                        {getResultForProvider("serpapi")?.responseTime && ` (${getResultForProvider("serpapi")?.responseTime}ms)`}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testSerpAPI}
                  disabled={testing === "serpapi"}
                >
                  {testing === "serpapi" ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    "Test"
                  )}
                </Button>
              </motion.div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Required Secrets Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Required Secrets for Launch</CardTitle>
          <CardDescription>
            Minimum secrets needed for production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Badge variant="destructive">Required</Badge>
              <code className="bg-muted px-2 py-0.5 rounded">OPENROUTER_API_KEY</code>
              <span className="text-muted-foreground">- Primary AI provider</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="secondary">Optional</Badge>
              <code className="bg-muted px-2 py-0.5 rounded">SERPAPI_API_KEY</code>
              <span className="text-muted-foreground">- Search enrichment for SEO</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="secondary">Future</Badge>
              <code className="bg-muted px-2 py-0.5 rounded">QWEN_API_KEY</code>
              <span className="text-muted-foreground">- Direct Qwen access (disabled)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
