import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/auth.ts";

// ==========================================
// PURELY HEALTH NUTRA — Customer AI Assistant
// Public endpoint powering every chat surface
// (floating widget, product pages, mobile,
// desktop, hub Assistant page).
//
// Primary model: NVIDIA NIM (env-driven).
// Fallback: secondary NVIDIA endpoint / model.
// Last resort: ai-orchestrator (z.ai chain).
// ==========================================

const SITE_URL = "https://purelyhealthnutra.com";

const SYSTEM_PROMPT = `You are the official AI wellness assistant for **Purely Health Nutra** (${SITE_URL}), a South African brand specialising in live probiotic cultures, spirulina, chlorella, kombucha, kefir and fermented-food starters.

## Your role
You are a friendly, professional, evidence-informed guide who helps customers pick the right products **from our own catalogue** for their gut-health, digestion, immunity and general-wellness goals.

## Absolute rules
1. **Only recommend products that appear in the "Available Products" list provided in this conversation.** Never invent products, never suggest competitor brands, never link to other stores.
2. Every product recommendation MUST use this exact inline token so the UI can render a card:
   \`[[product:<slug>]]\`
   Example: "I'd suggest our Live Water Kefir Grains [[product:live-water-kefir-grains]] as a starting point."
3. **Never diagnose disease.** Never claim any product cures, treats or prevents Cancer, Diabetes, autoimmune disease, heart disease, mental illness, or any medical condition.
4. Use soft, compliant phrasing only: "may support", "can assist", "traditionally used", "may contribute to".
5. For any serious, persistent or worsening symptom, gently recommend the customer consult a qualified healthcare professional.
6. Live cultures are non-returnable — mention this only if the customer asks about returns.

## How to respond
- Keep answers short, warm, easy to read. Use short paragraphs and the occasional bullet list.
- When a customer describes a symptom (e.g. "I have stomach problems"), first ask 2–3 clarifying follow-up questions before recommending:
  • How long has this been happening?
  • Any recent antibiotics?
  • Bloating, constipation, diarrhoea, food intolerances?
- When recommending, structure the reply as:
  **Primary recommendation** — product + why
  **Also consider** — optional secondary product + why
  **Lifestyle tips** — hydration, fibre, fermented foods, sleep
  **Safety note** — one-line disclaimer if relevant
- Educational topics you may discuss freely: gut microbiome, probiotics, prebiotics, fermented foods (kefir, water kefir, milk kefir, kombucha, ginger bug, ginger beer plant), spirulina, chlorella, hydration, fibre, natural nutrition.

## Contact info
📞 WhatsApp: +27 83 447 4639
✉ Email: admin@purelyhealthnutra.com
🌐 ${SITE_URL}

Be genuinely helpful. Guide, don't sell. 🌿`;

// -----------------------------------------------------------------------------
// NVIDIA NIM call with automatic key/endpoint/model fallback.
// Everything is read from env — no hardcoded credentials.
// -----------------------------------------------------------------------------
type NimAttempt = { key: string; baseUrl: string; model: string; label: string };

function buildNimAttempts(): NimAttempt[] {
  const k1 = Deno.env.get("NVIDIA_API_KEY_1");
  const b1 = Deno.env.get("NVIDIA_API_KEY_1_BASE_URL") || "https://integrate.api.nvidia.com/v1";
  const k2 = Deno.env.get("NVIDIA_API_KEY_2");
  const b2 = Deno.env.get("NVIDIA_API_KEY_2_BASE_URL") || b1;
  const primary = Deno.env.get("NVIDIA_MODEL_PRIMARY") || "nvidia/nemotron-mini-4b-instruct";
  const fallback = Deno.env.get("NVIDIA_MODEL_FALLBACK") || "meta/llama-3.1-8b-instruct";
  const attempts: NimAttempt[] = [];
  if (k1) attempts.push({ key: k1, baseUrl: b1, model: primary, label: "nvidia-1-primary" });
  if (k2) attempts.push({ key: k2, baseUrl: b2, model: primary, label: "nvidia-2-primary" });
  if (k1) attempts.push({ key: k1, baseUrl: b1, model: fallback, label: "nvidia-1-fallback" });
  if (k2) attempts.push({ key: k2, baseUrl: b2, model: fallback, label: "nvidia-2-fallback" });
  return attempts;
}

async function callNvidia(messages: any[], attempt: NimAttempt): Promise<Response> {
  const url = attempt.baseUrl.replace(/\/+$/, "") + "/chat/completions";
  return await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${attempt.key}`,
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
    },
    body: JSON.stringify({
      model: attempt.model,
      messages,
      stream: true,
      temperature: 0.6,
      top_p: 0.9,
      max_tokens: 1024,
    }),
  });
}

// -----------------------------------------------------------------------------
// Lightweight retrieval: keyword-ranked products + top KB articles.
// -----------------------------------------------------------------------------
function extractKeywords(text: string): string[] {
  const stop = new Set(["the","a","an","and","or","for","of","to","is","are","i","my","me","you","in","on","with","have","has","do","does","what","which","how","why","can","could","should","would","please","help","need","want","get","this","that","it","as","at","be","by","from","but","not","no"]);
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter(w => w.length > 2 && !stop.has(w));
}

async function retrieveContext(supabase: any, userText: string) {
  const kws = extractKeywords(userText);
  // All active products (catalogue is small enough)
  const { data: allProducts } = await supabase
    .from("products")
    .select("name, slug, short_description, price_zar, stock_quantity, is_featured")
    .eq("is_active", true)
    .limit(80);

  const scored = (allProducts || []).map((p: any) => {
    const hay = `${p.name} ${p.short_description || ""}`.toLowerCase();
    const score = kws.reduce((s, w) => s + (hay.includes(w) ? 2 : 0), 0) + (p.is_featured ? 0.5 : 0);
    return { ...p, score };
  }).sort((a: any, b: any) => b.score - a.score);

  const topProducts = scored.filter((p: any) => p.score > 0).slice(0, 8);
  const fillers = scored.filter((p: any) => p.score === 0).slice(0, 6);
  const products = topProducts.length ? topProducts : fillers;

  const { data: articles } = await supabase
    .from("knowledge_base")
    .select("title, content, category")
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .limit(8);

  return { products, articles: articles || [] };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { messages = [] } = await req.json();
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";

    const { products, articles } = await retrieveContext(supabase, String(lastUser));

    const productBlock = products.length
      ? "\n\n## Available Products (recommend ONLY from this list, cite with [[product:slug]])\n" +
        products.map((p: any) =>
          `- ${p.name} — slug: \`${p.slug}\` — R${p.price_zar} — ${p.stock_quantity > 0 ? "In stock" : "Out of stock"} — ${p.short_description || ""}`
        ).join("\n")
      : "";

    const kbBlock = articles.length
      ? "\n\n## Knowledge Base\n" +
        articles.map((a: any) => `[${a.category}] ${a.title}: ${String(a.content).slice(0, 240)}`).join("\n")
      : "";

    const fullSystem = SYSTEM_PROMPT + productBlock + kbBlock;
    const outboundMessages = [
      { role: "system", content: fullSystem },
      ...messages.filter((m: any) => m.role !== "system"),
    ];

    // ---- Try NVIDIA endpoints in order ----
    const attempts = buildNimAttempts();
    let lastErr = "";
    for (const attempt of attempts) {
      try {
        const resp = await callNvidia(outboundMessages, attempt);
        if (resp.ok && resp.body) {
          console.log(`[zai-chat] served by ${attempt.label} (${attempt.model})`);
          return new Response(resp.body, {
            headers: {
              ...corsHeaders,
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "X-AI-Provider": attempt.label,
            },
          });
        }
        lastErr = `${attempt.label}: ${resp.status} ${await resp.text().catch(() => "")}`.slice(0, 300);
        console.warn(`[zai-chat] ${lastErr}`);
      } catch (e: any) {
        lastErr = `${attempt.label}: ${e?.message || e}`;
        console.warn(`[zai-chat] ${lastErr}`);
      }
    }

    // ---- Last-resort: existing orchestrator (z.ai) ----
    console.warn("[zai-chat] All NVIDIA attempts failed, falling back to orchestrator");
    const orchestrator = await fetch(`${SUPABASE_URL}/functions/v1/ai-orchestrator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ type: "customer_chat", messages: outboundMessages, stream: true }),
    });

    if (orchestrator.ok && orchestrator.body) {
      return new Response(orchestrator.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-AI-Provider": "orchestrator-fallback",
        },
      });
    }

    return new Response(
      JSON.stringify({
        error: "AI service temporarily unavailable",
        detail: lastErr,
        fallback: "Please contact us directly:\n📱 WhatsApp: +27 83 447 4639\n✉ admin@purelyhealthnutra.com",
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[zai-chat] Error:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Chat service error",
        fallback: "Please contact us directly:\n📱 WhatsApp: +27 83 447 4639\n✉ admin@purelyhealthnutra.com",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
