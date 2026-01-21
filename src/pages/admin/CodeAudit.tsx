import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Loader2,
  FileCode,
  Database,
  Lock,
  Zap,
  Bug,
  Code,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface AuditResult {
  success: boolean;
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ParsedFinding {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  category: string;
  title: string;
  description: string;
  recommendation?: string;
}

const severityConfig = {
  CRITICAL: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
  HIGH: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  MEDIUM: { icon: Info, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  LOW: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  INFO: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30" },
};

const auditTemplates = [
  {
    id: "payment",
    label: "Payment Gateway Audit",
    icon: Lock,
    prompt: `Audit the following payment integration code for security issues:

PAYFAST PAYMENT FLOW:
- payfast-payment edge function initiates payments with merchant credentials
- payfast-itn edge function handles ITN (Instant Transaction Notification) webhooks
- MD5 signature verification for PayFast requests
- Order status updates after successful payment

YOCO PAYMENT FLOW:
- yoco-payment edge function creates checkout sessions via Yoco API
- yoco-webhook edge function handles payment webhooks
- HMAC signature verification for Yoco webhooks

Check for:
1. Signature verification bypass vulnerabilities
2. Amount manipulation risks
3. Order status race conditions
4. Idempotency handling
5. Error handling exposing sensitive data
6. Credential exposure in logs/responses`,
  },
  {
    id: "auth",
    label: "Authentication Audit",
    icon: Shield,
    prompt: `Audit the authentication system for vulnerabilities:

CURRENT IMPLEMENTATION:
- Supabase Auth for user management
- user_roles table with RLS policies
- has_role() function for RBAC checks
- Admin route protection via isAdmin check

Check for:
1. Session fixation/hijacking risks
2. Role escalation vulnerabilities
3. JWT validation issues
4. RLS policy bypasses
5. Missing auth checks on sensitive endpoints
6. Password policy enforcement`,
  },
  {
    id: "database",
    label: "Database Security Audit",
    icon: Database,
    prompt: `Audit database security and RLS policies:

TABLES:
- orders (guest_email, customer_id, payment_status, shipping_address)
- payments (order_id, provider, payment_data, status)
- products (price_zar, stock_quantity, is_active)
- customers (email, default_shipping_address)
- user_roles (user_id, role)

Check for:
1. RLS policies allowing unauthorized access
2. Overly permissive USING (true) policies
3. Missing policies on sensitive columns
4. SQL injection risks in edge functions
5. Data exposure in API responses
6. Foreign key validation gaps`,
  },
  {
    id: "api",
    label: "API Security Audit",
    icon: Zap,
    prompt: `Audit edge functions and API endpoints:

EDGE FUNCTIONS:
- payfast-payment, payfast-itn
- yoco-payment, yoco-webhook
- shipping-rates
- kilo-ai (AI integration)
- send-email

Check for:
1. Input validation and sanitization
2. Rate limiting implementation
3. CORS configuration issues
4. Error message information leakage
5. Authentication requirements
6. Webhook signature verification`,
  },
  {
    id: "frontend",
    label: "Frontend Security Audit",
    icon: Code,
    prompt: `Audit React frontend for security issues:

COMPONENTS:
- Checkout flow with payment selection
- Admin dashboard with RBAC
- Cart functionality
- Order tracking

Check for:
1. XSS vulnerabilities in user inputs
2. CSRF protection
3. Sensitive data in localStorage/state
4. Insecure direct object references
5. Client-side validation bypasses
6. Debug information exposure`,
  },
  {
    id: "full",
    label: "Full Stack Audit",
    icon: Bug,
    prompt: `Perform a comprehensive fullstack security audit of the Dragon Fruit SA e-commerce platform:

ARCHITECTURE:
- React + Vite + TypeScript frontend
- Supabase backend (PostgreSQL + Auth + Edge Functions)
- PayFast and Yoco payment integrations
- AI integration via Kilo.AI

Analyze ALL security aspects:
1. Authentication & Authorization (RBAC, session management)
2. Payment Security (signature verification, amount validation)
3. Database Security (RLS policies, data exposure)
4. API Security (input validation, rate limiting)
5. Frontend Security (XSS, CSRF, client-side issues)
6. Configuration Security (secrets, environment variables)
7. Error Handling (information disclosure)
8. Logging & Monitoring (audit trails)

Provide severity ratings and actionable recommendations.`,
  },
];

export default function CodeAudit() {
  const [customPrompt, setCustomPrompt] = useState("");
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [expandedFindings, setExpandedFindings] = useState<Set<number>>(new Set());
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const auditMutation = useMutation({
    mutationFn: async (prompt: string): Promise<AuditResult> => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/kilo-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "audit",
          prompt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Audit failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAuditResult(data.content);
      toast.success("Audit completed", {
        description: `Analyzed using ${data.model}`,
      });
    },
    onError: (error: Error) => {
      toast.error("Audit failed", { description: error.message });
    },
  });

  const runAudit = (templateId: string) => {
    const template = auditTemplates.find((t) => t.id === templateId);
    if (template) {
      setActiveTemplate(templateId);
      auditMutation.mutate(template.prompt);
    }
  };

  const runCustomAudit = () => {
    if (!customPrompt.trim()) {
      toast.error("Please enter code or context to audit");
      return;
    }
    setActiveTemplate(null);
    auditMutation.mutate(customPrompt);
  };

  const parseFindings = (content: string): ParsedFinding[] => {
    const findings: ParsedFinding[] = [];
    const lines = content.split("\n");

    let currentFinding: Partial<ParsedFinding> | null = null;

    for (const line of lines) {
      // Match severity markers
      const severityMatch = line.match(/\*?\*?(CRITICAL|HIGH|MEDIUM|LOW|INFO)\*?\*?:?\s*(.+)?/i);
      if (severityMatch) {
        if (currentFinding?.severity && currentFinding?.title) {
          findings.push(currentFinding as ParsedFinding);
        }
        currentFinding = {
          severity: severityMatch[1].toUpperCase() as ParsedFinding["severity"],
          title: severityMatch[2]?.trim() || "",
          category: "General",
          description: "",
        };
        continue;
      }

      // Match category markers
      const categoryMatch = line.match(/^#+\s*(\d+\.\s*)?(SECURITY|PERFORMANCE|RELIABILITY|MAINTAINABILITY|PAYMENT)/i);
      if (categoryMatch && currentFinding) {
        currentFinding.category = categoryMatch[2];
        continue;
      }

      // Add to description
      if (currentFinding && line.trim()) {
        currentFinding.description += line.trim() + " ";
      }
    }

    // Add last finding
    if (currentFinding?.severity && currentFinding?.title) {
      findings.push(currentFinding as ParsedFinding);
    }

    return findings;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const toggleFinding = (index: number) => {
    const newExpanded = new Set(expandedFindings);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFindings(newExpanded);
  };

  const findings = auditResult ? parseFindings(auditResult) : [];
  const criticalCount = findings.filter((f) => f.severity === "CRITICAL").length;
  const highCount = findings.filter((f) => f.severity === "HIGH").length;
  const mediumCount = findings.filter((f) => f.severity === "MEDIUM").length;
  const lowCount = findings.filter((f) => f.severity === "LOW" || f.severity === "INFO").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Code Security Audit
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered security analysis using DeepSeek R1 reasoning model
          </p>
        </div>
        <Badge variant="outline" className="self-start md:self-auto">
          Powered by Kilo.AI
        </Badge>
      </div>

      {/* Audit Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Quick Audit Templates
          </CardTitle>
          <CardDescription>
            Run pre-configured security audits on specific areas of the codebase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {auditTemplates.map((template) => (
              <Button
                key={template.id}
                variant={activeTemplate === template.id ? "default" : "outline"}
                className="h-auto py-4 flex-col gap-2"
                onClick={() => runAudit(template.id)}
                disabled={auditMutation.isPending}
              >
                <template.icon className="h-5 w-5" />
                <span className="text-xs text-center">{template.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Audit */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Code Audit</CardTitle>
          <CardDescription>
            Paste code snippets or describe specific areas to audit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste code here or describe the security concern you want to analyze..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={runCustomAudit} disabled={auditMutation.isPending}>
              {auditMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Run Audit
                </>
              )}
            </Button>
            {auditResult && (
              <Button variant="outline" onClick={() => setAuditResult(null)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      <AnimatePresence>
        {auditMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-primary/30">
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    <Shield className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Running Security Analysis...</p>
                    <p className="text-sm text-muted-foreground">
                      DeepSeek R1 is analyzing your code for vulnerabilities
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {auditResult && !auditMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className={cn("border-red-500/30", criticalCount > 0 && "bg-red-500/5")}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Critical</p>
                      <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className={cn("border-orange-500/30", highCount > 0 && "bg-orange-500/5")}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">High</p>
                      <p className="text-2xl font-bold text-orange-500">{highCount}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className={cn("border-yellow-500/30", mediumCount > 0 && "bg-yellow-500/5")}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Medium</p>
                      <p className="text-2xl font-bold text-yellow-500">{mediumCount}</p>
                    </div>
                    <Info className="h-8 w-8 text-yellow-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-500/30">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Low/Info</p>
                      <p className="text-2xl font-bold text-green-500">{lowCount}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Results */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Audit Results</CardTitle>
                  <CardDescription>
                    {findings.length} findings detected
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(auditResult)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Report
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="findings">
                  <TabsList className="mb-4">
                    <TabsTrigger value="findings">Findings</TabsTrigger>
                    <TabsTrigger value="raw">Raw Output</TabsTrigger>
                  </TabsList>

                  <TabsContent value="findings">
                    {findings.length > 0 ? (
                      <div className="space-y-3">
                        {findings.map((finding, index) => {
                          const config = severityConfig[finding.severity];
                          const Icon = config.icon;
                          const isExpanded = expandedFindings.has(index);

                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Card
                                className={cn(
                                  "cursor-pointer transition-all hover:shadow-md",
                                  config.border,
                                  config.bg
                                )}
                                onClick={() => toggleFinding(index)}
                              >
                                <CardContent className="py-4">
                                  <div className="flex items-start gap-3">
                                    <Icon className={cn("h-5 w-5 mt-0.5", config.color)} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                          variant="outline"
                                          className={cn(config.color, config.border)}
                                        >
                                          {finding.severity}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                          {finding.category}
                                        </Badge>
                                        <span className="font-medium flex-1">
                                          {finding.title}
                                        </span>
                                        {isExpanded ? (
                                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                          >
                                            <p className="text-sm text-muted-foreground mt-2">
                                              {finding.description}
                                            </p>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p>No specific findings parsed. Check raw output for details.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="raw">
                    <ScrollArea className="h-[500px] rounded-lg border bg-muted/30 p-4">
                      <pre className="text-sm font-mono whitespace-pre-wrap">
                        {auditResult}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
