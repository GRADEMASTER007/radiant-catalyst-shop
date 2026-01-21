import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Use mistralai/devstral-2512:free as specified by user
const AUDIT_MODEL = "mistralai/devstral-2512:free";

interface AuditRequest {
  type: "security" | "performance" | "best-practices" | "full" | "deployment-check";
  code?: string;
  context?: string;
  files?: Array<{ path: string; content: string }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const { type, code, context, files }: AuditRequest = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "security":
        systemPrompt = `You are a senior security engineer specializing in web application security audits.
Your task is to analyze code for:
- SQL injection vulnerabilities
- XSS (Cross-Site Scripting) risks
- CSRF vulnerabilities
- Authentication/Authorization flaws
- Sensitive data exposure
- Insecure dependencies
- API security issues
- RLS (Row Level Security) policy gaps in Supabase

Provide actionable recommendations with severity levels (Critical, High, Medium, Low).
Format your response as JSON with this structure:
{
  "summary": "Brief overview",
  "issues": [{ "severity": "Critical|High|Medium|Low", "title": "", "description": "", "location": "", "fix": "" }],
  "recommendations": [""],
  "score": 0-100
}`;
        break;

      case "performance":
        systemPrompt = `You are a performance optimization specialist for React/TypeScript web applications.
Analyze code for:
- Unnecessary re-renders
- Memory leaks
- Bundle size issues
- Lazy loading opportunities
- Database query optimization
- Caching strategies
- Network request optimization

Provide specific optimization suggestions with expected impact.
Format your response as JSON:
{
  "summary": "",
  "issues": [{ "impact": "High|Medium|Low", "title": "", "description": "", "location": "", "optimization": "" }],
  "recommendations": [""],
  "score": 0-100
}`;
        break;

      case "best-practices":
        systemPrompt = `You are a senior React/TypeScript developer reviewing code for best practices.
Check for:
- TypeScript type safety
- React hooks usage
- Component structure
- State management
- Error handling
- Code organization
- Naming conventions
- Documentation

Format your response as JSON:
{
  "summary": "",
  "issues": [{ "category": "", "title": "", "description": "", "location": "", "improvement": "" }],
  "recommendations": [""],
  "score": 0-100
}`;
        break;

      case "deployment-check":
        systemPrompt = `You are a DevOps engineer checking if an application is ready for deployment.
Verify:
- Environment variables are properly configured
- No hardcoded secrets or API keys
- Error handling is in place
- Database migrations are complete
- RLS policies are properly set
- Edge functions are deployable
- Build will succeed
- No console.log statements in production code
- Proper error boundaries
- Meta tags and SEO configured

Format your response as JSON:
{
  "ready": true|false,
  "blockers": [{ "severity": "Critical|High", "issue": "", "fix": "" }],
  "warnings": [{ "issue": "", "recommendation": "" }],
  "checklist": [{ "item": "", "status": "pass|fail|warning", "details": "" }]
}`;
        break;

      case "full":
      default:
        systemPrompt = `You are a senior full-stack engineer performing a comprehensive code audit.
Analyze for:
1. Security vulnerabilities
2. Performance issues
3. Best practices violations
4. Deployment readiness
5. Code quality
6. Accessibility
7. SEO optimization

Provide a complete audit report with actionable recommendations.
Format your response as JSON:
{
  "overallScore": 0-100,
  "security": { "score": 0-100, "issues": [], "recommendations": [] },
  "performance": { "score": 0-100, "issues": [], "recommendations": [] },
  "bestPractices": { "score": 0-100, "issues": [], "recommendations": [] },
  "deploymentReady": true|false,
  "summary": "",
  "priorityActions": [""]
}`;
        break;
    }

    // Build the user prompt
    if (files && files.length > 0) {
      userPrompt = `Please audit the following files:\n\n`;
      files.forEach((file) => {
        userPrompt += `--- ${file.path} ---\n${file.content}\n\n`;
      });
    } else if (code) {
      userPrompt = `Please audit the following code:\n\n${code}`;
    } else {
      userPrompt = context || "Please provide a general audit checklist for a React/Supabase e-commerce application.";
    }

    if (context) {
      userPrompt += `\n\nAdditional context: ${context}`;
    }

    console.log(`Running ${type} audit using model: ${AUDIT_MODEL}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://dfsa-ecommerce.lovable.app",
        "X-Title": "DFSA Code Audit",
      },
      body: JSON.stringify({
        model: AUDIT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1, // Low temperature for more consistent audit results
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse as JSON
    let auditResult;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        auditResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        auditResult = { rawResponse: content };
      }
    } catch {
      auditResult = { rawResponse: content };
    }

    return new Response(
      JSON.stringify({
        success: true,
        type,
        model: AUDIT_MODEL,
        audit: auditResult,
        usage: data.usage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Code audit error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Audit failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
