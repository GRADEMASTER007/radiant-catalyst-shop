import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// FAQ database
const faqs: Record<string, any> = {
  shipping: {
    question: "How long does shipping take?",
    answer: "Gauteng: 1-2 days, Western Cape/KZN: 2-3 days, Other: 3-5 days. Cuttings shipped Mon-Wed with heat packs in winter."
  },
  rooting: {
    question: "How do I root my cutting?",
    answer: "1. Let callus 5-7 days\n2. Plant in 50/50 perlite/soil mix\n3. Water lightly\n4. Bright indirect light\n5. Roots in 2-4 weeks"
  },
  fruiting: {
    question: "When will my plant fruit?",
    answer: "From cutting: 18-24 months. From rooted plant: 12-18 months. Plants need 1.5m height with multiple branches."
  },
  wintercare: {
    question: "How do I protect plants in winter?",
    answer: "Stop watering May-Sept. Cover if frost expected (below 2°C). No pruning or fertilizer during dormancy."
  },
  payment: {
    question: "What payment methods do you accept?",
    answer: "Credit/Debit cards via Yoco, Instant EFT, Direct bank transfer. Secure SSL checkout."
  },
  guarantee: {
    question: "Do you offer a guarantee?",
    answer: "Yes! Live arrival guaranteed. If DOA, send photos within 24 hours for full replacement."
  },
  pollination: {
    question: "Do I need multiple plants?",
    answer: "Some varieties self-pollinate, but hand pollination at night (7pm-midnight) dramatically increases yield."
  }
};

const supportResponses: Record<string, string> = {
  "shipping-delay": "I understand waiting is frustrating! Let me check your shipment. Standard delivery: Gauteng 1-2 days, other provinces 2-5 days. Our plants are packaged to stay healthy for up to 7 days.",
  "damaged-plant": "I'm sorry your plant arrived damaged! Please send photos of the plant and packaging within 24 hours. We'll arrange a replacement right away - no need to return the damaged item.",
  "rooting-help": "Happy to help! Check: ✅ Callused 5-7 days? ✅ Well-draining soil? ✅ Bright indirect light? ✅ Watering only when dry? Yellow/soft = too much water. Shriveling = needs humidity.",
  "payment-issue": "Sorry for payment difficulties! Try: different browser, clear cache, enable 3D Secure with your bank, or I can send direct EFT details."
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tool, params } = await req.json();
    let result: any;

    switch (tool) {
      case "answer_faq": {
        const topic = params?.topic?.toLowerCase().replace(/[^a-z]/g, '') || "";
        const question = params?.question?.toLowerCase() || "";
        
        // Find best match
        let match = faqs[topic];
        if (!match) {
          for (const [key, faq] of Object.entries(faqs)) {
            if (question.includes(key) || faq.question.toLowerCase().includes(question.split(' ')[0])) {
              match = faq;
              break;
            }
          }
        }
        
        if (match) {
          result = { success: true, data: match };
        } else {
          result = {
            success: true,
            data: {
              answer: "I don't have a specific answer. Contact us at info@dragonfruitsa.co.za or WhatsApp for help.",
              suggestedTopics: Object.keys(faqs)
            }
          };
        }
        break;
      }

      case "get_order_status": {
        const orderNumber = params?.orderNumber;
        if (!orderNumber) {
          result = { success: false, error: "Order number required" };
          break;
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (!supabaseUrl || !supabaseKey) {
          result = { success: false, error: "Service unavailable" };
          break;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: order, error } = await supabase
          .from("orders")
          .select("order_number, status, payment_status, created_at, shipped_at, tracking_number")
          .eq("order_number", orderNumber)
          .single();

        if (error || !order) {
          result = { success: false, error: "Order not found" };
        } else {
          const statusMessages: Record<string, string> = {
            pending: "⏳ Awaiting payment",
            confirmed: "✅ Preparing order",
            processing: "📦 Ready to ship",
            shipped: "🚚 On the way!",
            delivered: "✅ Delivered",
            cancelled: "❌ Cancelled"
          };
          result = {
            success: true,
            data: {
              ...order,
              statusMessage: statusMessages[order.status] || order.status
            }
          };
        }
        break;
      }

      case "generate_support_response": {
        const issueType = params?.issueType?.toLowerCase() || "general";
        const customerName = params?.customerName || "there";
        
        const response = supportResponses[issueType] || 
          `Hi ${customerName}! How can I help you today with your dragon fruit questions?`;
        
        result = {
          success: true,
          data: {
            response: `Hi ${customerName}! 👋\n\n${response}`,
            issueType
          }
        };
        break;
      }

      case "get_farming_tips": {
        const topic = params?.topic?.toLowerCase() || "general";
        
        const tips: Record<string, string[]> = {
          general: ["6+ hours sunlight", "Well-draining soil pH 6-7", "Sturdy support structures", "Frost protection in winter"],
          watering: ["Water deeply but infrequently", "Allow soil to dry between waterings", "Reduce in winter", "Avoid waterlogging"],
          fertilizing: ["Balanced fertilizer during growth", "High-potassium during flowering", "Annual compost", "Avoid excess nitrogen"],
          pests: ["Check for mealybugs/scale regularly", "Neem oil for organic control", "Remove affected parts", "Good air circulation"]
        };
        
        result = {
          success: true,
          data: { topic, tips: tips[topic] || tips.general }
        };
        break;
      }

      case "list_tools": {
        result = {
          success: true,
          tools: [
            { name: "answer_faq", params: ["topic", "question"] },
            { name: "get_order_status", params: ["orderNumber"] },
            { name: "generate_support_response", params: ["issueType", "customerName"] },
            { name: "get_farming_tips", params: ["topic"] }
          ]
        };
        break;
      }

      default:
        result = { success: false, error: `Unknown tool: ${tool}` };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};

serve(handler);
