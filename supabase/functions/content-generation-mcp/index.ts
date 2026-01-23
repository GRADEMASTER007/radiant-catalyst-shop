import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const articleStructures: Record<string, string[]> = {
  "beginner-guide": ["Introduction", "Why Dragon Fruit?", "Getting Started", "First Steps", "Common Mistakes", "Conclusion"],
  "variety-spotlight": ["Introduction", "Origin & History", "Characteristics", "Growing Requirements", "Taste & Uses"],
  "seasonal-guide": ["Season Overview", "Key Tasks", "Problems to Watch", "Tips for Success", "Checklist"],
  "success-story": ["Background", "The Challenge", "The Solution", "Results", "Key Takeaways"]
};

const socialTemplates: Record<string, any> = {
  instagram: {
    promo: "🐉✨ NEW IN STOCK: {topic}\n\nFresh from our nursery!\n✓ Proven genetics\n✓ Disease-free\n✓ Rooting support\n\n📦 Nationwide delivery\nTap link in bio!\n\n#DragonFruit #Pitaya #GrowYourOwn",
    educational: "📚🌱 DID YOU KNOW?\n\n{topic}\n\nSave this post for later! 📌\n\n#DragonFruitTips #GardeningTips",
    maxLength: 2200
  },
  facebook: {
    promo: "🌟 Fresh Stock Alert!\n\n{topic} now available.\n\n• Certified disease-free\n• Nationwide delivery\n• Full growing support\n\nOrder now: [link]",
    educational: "{topic}\n\nNeed help? Comment below or message us!\n\n#DragonFruit #GardeningTips",
    maxLength: 63206
  },
  whatsapp: {
    promo: "🐉 *{topic}*\n\nHi! Fresh stock just arrived.\n\n*Prices:*\n- White: R80\n- Red: R100\n- Yellow: R150\n\n📦 Nationwide delivery\n\nReply to order!",
    maxLength: 4096
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tool, params } = await req.json();
    let result: any;

    switch (tool) {
      case "generate_article": {
        const topic = params?.topic || "Dragon Fruit Growing Tips";
        const articleType = params?.articleType || "beginner-guide";
        const audience = params?.audience || "beginner";
        
        const structure = articleStructures[articleType] || articleStructures["beginner-guide"];
        
        result = {
          success: true,
          data: {
            title: `${topic}: A Complete Guide for ${audience === "beginner" ? "Beginners" : "Experienced Growers"}`,
            metaTitle: `${topic} | Dragon Fruit Farming South Africa`,
            metaDescription: `Learn about ${topic.toLowerCase()} from SA's dragon fruit experts. Tips for ${audience} growers.`,
            structure: structure.map((section, i) => ({
              order: i + 1,
              heading: section,
              suggestedWords: Math.round(1500 / structure.length)
            })),
            seoKeywords: [topic.toLowerCase(), "dragon fruit", "pitaya", "south africa", "farming"],
            callToAction: "Shop our premium cuttings to start your journey"
          }
        };
        break;
      }

      case "generate_product_description": {
        const productName = params?.productName || "Dragon Fruit Cutting";
        const features = params?.features || ["Premium quality", "Disease-free", "Ready to root"];
        const pricePoint = params?.pricePoint || "standard";
        
        const descriptions: Record<string, string> = {
          budget: `**${productName}**\n\nQuality cutting at accessible pricing. Perfect for first-time growers.\n\n${features.map((f: string) => `• ${f}`).join('\n')}`,
          standard: `**${productName}**\n\nPremium-grade cutting from certified mother plants.\n\n**Features:**\n${features.map((f: string) => `✓ ${f}`).join('\n')}\n\n**Included:** Rooting guide + WhatsApp support`,
          premium: `**${productName}** ⭐ Premium Selection\n\nOur finest cutting from highest-producing mother plants.\n\n${features.map((f: string) => `★ ${f}`).join('\n')}\n\n**Premium Guarantee:** Free replacement if doesn't root in 6 weeks.`
        };
        
        result = {
          success: true,
          data: {
            description: descriptions[pricePoint] || descriptions.standard,
            shortDescription: `Premium ${productName} - ${features[0]}`,
            metaTitle: `${productName} | Dragon Fruit SA`,
            metaDescription: `Buy ${productName}. ${features[0]}. Fast delivery.`
          }
        };
        break;
      }

      case "create_social_media_content": {
        const platform = params?.platform?.toLowerCase() || "instagram";
        const contentType = params?.contentType || "promo";
        const topic = params?.topic || "Dragon Fruit Cuttings";
        
        const template = socialTemplates[platform];
        if (!template) {
          result = { success: false, error: `Unknown platform. Available: ${Object.keys(socialTemplates).join(", ")}` };
          break;
        }
        
        const content = (template[contentType] || template.promo).replace(/{topic}/g, topic);
        
        const postTimes: Record<string, string> = {
          instagram: "6-9 AM or 7-9 PM",
          facebook: "1-4 PM weekdays",
          whatsapp: "9-11 AM or 4-6 PM"
        };
        
        result = {
          success: true,
          data: {
            platform,
            contentType,
            post: content,
            characterCount: content.length,
            maxLength: template.maxLength,
            bestTimeToPost: postTimes[platform] || "9 AM - 5 PM",
            tips: ["Include clear call-to-action", "Use high-quality images", "Respond to comments quickly"]
          }
        };
        break;
      }

      case "generate_email_template": {
        const type = params?.type || "newsletter";
        const subject = params?.subject || "Dragon Fruit News";
        
        const templates: Record<string, any> = {
          newsletter: {
            subject: `🌵 ${subject} - This Month's Tips`,
            preheader: "Expert advice for your dragon fruit garden",
            sections: ["Featured Article", "Product Spotlight", "Seasonal Tips"]
          },
          promotion: {
            subject: `🔥 ${subject} - Limited Time Offer!`,
            preheader: "Don't miss out on exclusive deals",
            sections: ["Hero Offer", "Featured Products", "Shop Now CTA"]
          },
          orderConfirmation: {
            subject: `✅ Order Confirmed - ${subject}`,
            preheader: "Thank you for your order",
            sections: ["Order Summary", "Shipping Info", "Care Guide"]
          }
        };
        
        const template = templates[type] || templates.newsletter;
        
        result = {
          success: true,
          data: {
            type,
            ...template,
            ctaButton: type === "promotion" ? "Shop Now" : "Read More"
          }
        };
        break;
      }

      case "list_tools": {
        result = {
          success: true,
          tools: [
            { name: "generate_article", params: ["topic", "articleType", "audience"] },
            { name: "generate_product_description", params: ["productName", "features", "pricePoint"] },
            { name: "create_social_media_content", params: ["platform", "contentType", "topic"] },
            { name: "generate_email_template", params: ["type", "subject"] }
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
