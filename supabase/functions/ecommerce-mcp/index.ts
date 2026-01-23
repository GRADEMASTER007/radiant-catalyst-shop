import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product description templates
const productTemplates: Record<string, any> = {
  cutting: {
    template: (name: string, variety: string, features: string[]) => 
      `🌱 **${name}**\n\nPremium ${variety || 'dragon fruit'} cutting from our certified nursery. Hand-selected for optimal rooting potential.\n\n**Features:**\n${features.map(f => `✓ ${f}`).join('\n')}\n\n**Included:** Rooting guide + WhatsApp support.\n\n*Start your dragon fruit journey with genetics you can trust.*`,
    defaultFeatures: ["Disease-free stock", "30-40cm cutting", "Fast rooting genetics"]
  },
  plant: {
    template: (name: string, variety: string, features: string[]) =>
      `🌿 **${name}**\n\nReady-to-plant ${variety || 'dragon fruit'} with established root system.\n\n**Features:**\n${features.map(f => `✓ ${f}`).join('\n')}\n\n*Skip the rooting phase and start growing immediately!*`,
    defaultFeatures: ["Established roots", "3-6 months old", "Fruiting within 18-24 months"]
  },
  fruit: {
    template: (name: string, variety: string, features: string[]) =>
      `🐉 **${name}**\n\nFarm-fresh ${variety || 'dragon fruit'} harvested at peak ripeness.\n\n**Features:**\n${features.map(f => `✓ ${f}`).join('\n')}\n\n*Taste the difference of locally grown dragon fruit!*`,
    defaultFeatures: ["Naturally grown", "Rich in antioxidants", "Perfect ripeness"]
  }
};

// Pricing strategies
const pricingData = {
  cutting: { min: 50, standard: 80, premium: 150 },
  plant: { min: 120, standard: 180, premium: 350 },
  fruit: { min: 80, standard: 120, premium: 200 },
  consulting: { min: 500, standard: 1500, premium: 5000 }
};

const varietyMultiplier: Record<string, number> = {
  "vietnamese-white": 1.0,
  "red-flesh": 1.3,
  "yellow-dragon": 1.8
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tool, params } = await req.json();
    let result: any;

    switch (tool) {
      case "generate_product_description": {
        const productName = params?.productName || "Dragon Fruit Cutting";
        const productType = params?.productType?.toLowerCase() || "cutting";
        const variety = params?.variety || "dragon fruit";
        const features = params?.features || productTemplates[productType]?.defaultFeatures || [];
        
        const template = productTemplates[productType];
        if (template) {
          result = {
            success: true,
            data: {
              description: template.template(productName, variety, features),
              shortDescription: `Premium ${variety} ${productType} - ${features[0]}`,
              metaTitle: `${productName} | Dragon Fruit South Africa`,
              metaDescription: `Buy ${productName} online. ${features[0]}. Fast nationwide delivery.`
            }
          };
        } else {
          result = { success: false, error: "Unknown product type" };
        }
        break;
      }

      case "optimize_product_seo": {
        const productName = params?.productName || "Dragon Fruit";
        const category = params?.category || "Plants";
        
        result = {
          success: true,
          data: {
            metaTitle: `${productName} | Buy Online | Dragon Fruit SA`,
            metaDescription: `Shop ${productName} from South Africa's leading dragon fruit nursery. Proven genetics, nationwide delivery. Order now!`,
            keywords: [productName.toLowerCase(), "dragon fruit", "pitaya", "south africa", "buy online"],
            suggestions: [
              "Include primary keyword in first 60 characters of title",
              "Use descriptive alt text for images",
              "Add structured data for products",
              "Include customer reviews for social proof"
            ]
          }
        };
        break;
      }

      case "get_pricing_strategy": {
        const productType = params?.productType?.toLowerCase() || "cutting";
        const variety = params?.variety?.toLowerCase() || "vietnamese-white";
        const quantity = params?.quantity || 1;
        
        const base = pricingData[productType as keyof typeof pricingData] || pricingData.cutting;
        const multiplier = varietyMultiplier[variety] || 1.0;
        
        let discount = 0;
        if (quantity >= 100) discount = 0.25;
        else if (quantity >= 50) discount = 0.15;
        else if (quantity >= 20) discount = 0.10;
        else if (quantity >= 10) discount = 0.05;
        
        const standardPrice = Math.round(base.standard * multiplier);
        
        result = {
          success: true,
          data: {
            productType,
            variety,
            quantity,
            prices: {
              budget: Math.round(base.min * multiplier),
              standard: standardPrice,
              premium: Math.round(base.premium * multiplier)
            },
            bulkDiscount: `${discount * 100}%`,
            bulkPrice: Math.round(standardPrice * (1 - discount)),
            recommendations: [
              "Set premium price for website, offer discounts for bulk",
              "Higher prices in spring planting season",
              variety === "yellow-dragon" ? "Yellow commands 50-80% premium" : null
            ].filter(Boolean)
          }
        };
        break;
      }

      case "get_inventory_advice": {
        const month = params?.currentMonth || new Date().getMonth() + 1;
        
        const seasonalDemand: Record<number, any> = {
          1: { demand: "medium", note: "Post-holiday, new year resolutions" },
          2: { demand: "medium", note: "Summer continues" },
          3: { demand: "low", note: "Autumn approaching" },
          4: { demand: "low", note: "Slow season" },
          5: { demand: "low", note: "Winter prep" },
          6: { demand: "low", note: "Dormant period" },
          7: { demand: "low", note: "Mid-winter" },
          8: { demand: "medium", note: "Early orders for spring" },
          9: { demand: "high", note: "PEAK - Spring planting begins" },
          10: { demand: "high", note: "Peak planting continues" },
          11: { demand: "high", note: "Last planting window" },
          12: { demand: "medium", note: "Holiday season" }
        };
        
        const monthData = seasonalDemand[month] || seasonalDemand[1];
        
        result = {
          success: true,
          data: {
            month,
            demand: monthData.demand,
            note: monthData.note,
            stockRecommendation: monthData.demand === "high" ? "150% of normal" : monthData.demand === "low" ? "50% stock" : "100% stock",
            actions: monthData.demand === "high" 
              ? ["Prepare additional cuttings", "Stock packaging", "Brief shipping partners"]
              : ["Focus on mother plant care", "Prepare for next season"]
          }
        };
        break;
      }

      case "list_tools": {
        result = {
          success: true,
          tools: [
            { name: "generate_product_description", params: ["productName", "productType", "variety", "features"] },
            { name: "optimize_product_seo", params: ["productName", "category"] },
            { name: "get_pricing_strategy", params: ["productType", "variety", "quantity"] },
            { name: "get_inventory_advice", params: ["currentMonth"] }
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
