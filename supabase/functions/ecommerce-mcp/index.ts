import { Hono } from "npm:hono@4";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";

const app = new Hono();

const mcpServer = new McpServer({
  name: "ecommerce-product-management-mcp",
  version: "1.0.0",
});

// Tool: Generate product description
mcpServer.tool({
  name: "generate_product_description",
  description: "Generate an SEO-optimized product description for dragon fruit plants or products",
  inputSchema: {
    type: "object",
    properties: {
      productName: { type: "string", description: "Name of the product" },
      productType: { 
        type: "string", 
        description: "Type: cutting, rooted-plant, fruit, accessory" 
      },
      variety: { type: "string", description: "Dragon fruit variety if applicable" },
      features: { 
        type: "array", 
        items: { type: "string" },
        description: "Key features of the product" 
      }
    },
    required: ["productName", "productType"]
  },
  handler: async ({ productName, productType, variety, features }) => {
    const templates = {
      "cutting": `🌱 **${productName}**\n\nPremium ${variety || 'dragon fruit'} cutting from our certified nursery in South Africa. Each cutting is carefully selected from high-yielding mother plants and prepared for optimal rooting success.\n\n**What You'll Receive:**\n- Fresh, healthy cutting (30-40cm)\n- Detailed rooting instructions\n- WhatsApp support during rooting period\n\n**Features:**\n${(features || ['Disease-free stock', 'Fast rooting genetics', 'Proven variety']).map(f => `✓ ${f}`).join('\n')}\n\n**Shipping:** Nationwide delivery with heat packs in winter. Cuttings shipped Monday-Wednesday to ensure freshness.\n\n*Start your dragon fruit journey with genetics you can trust.*`,
      
      "rooted-plant": `🌿 **${productName}**\n\nReady-to-plant ${variety || 'dragon fruit'} with established root system. Skip the rooting phase and start growing immediately!\n\n**Plant Specifications:**\n- Well-rooted in growing medium\n- 3-6 months old\n- Ready for transplanting\n\n**Features:**\n${(features || ['Established roots', 'Hardened off', 'Fruiting within 18-24 months']).map(f => `✓ ${f}`).join('\n')}\n\n**Care Instructions Included:** Complete growing guide for South African conditions.\n\n*Perfect for growers who want a head start!*`,
      
      "fruit": `🐉 **${productName}**\n\nFarm-fresh ${variety || 'dragon fruit'} harvested at peak ripeness from our dragon fruit farm.\n\n**Quality Guarantee:**\n- Harvested within 48 hours of shipping\n- No pesticides or artificial ripening\n- Hand-selected for quality\n\n**Features:**\n${(features || ['Naturally grown', 'Rich in antioxidants', 'Perfect ripeness']).map(f => `✓ ${f}`).join('\n')}\n\n**Nutritional Benefits:** High in fiber, vitamin C, and beneficial prebiotics.\n\n*Taste the difference of locally grown dragon fruit!*`,
      
      "accessory": `🛠️ **${productName}**\n\nEssential equipment for successful dragon fruit cultivation.\n\n**Product Details:**\n${(features || ['High quality materials', 'Designed for dragon fruit', 'Durable construction']).map(f => `✓ ${f}`).join('\n')}\n\n**Why Choose This Product:**\nSpecifically designed for dragon fruit farming based on our years of experience. Built to withstand South African conditions.\n\n*Equip your farm for success!*`
    };

    const description = templates[productType as keyof typeof templates] || templates["cutting"];
    
    return {
      content: [{
        type: "text",
        text: description
      }]
    };
  }
});

// Tool: Optimize product SEO
mcpServer.tool({
  name: "optimize_product_seo",
  description: "Generate SEO metadata for a product page",
  inputSchema: {
    type: "object",
    properties: {
      productName: { type: "string", description: "Name of the product" },
      category: { type: "string", description: "Product category" },
      variety: { type: "string", description: "Dragon fruit variety" }
    },
    required: ["productName"]
  },
  handler: async ({ productName, category, variety }) => {
    const seoData = {
      metaTitle: `${productName} | Dragon Fruit South Africa - Premium Plants & Cuttings`,
      metaDescription: `Buy ${productName} from South Africa's leading dragon fruit nursery. ${variety ? `${variety} variety with ` : ''}proven genetics, nationwide delivery, expert support. Order now!`,
      keywords: [
        productName.toLowerCase(),
        "dragon fruit",
        "pitaya",
        variety?.toLowerCase(),
        category?.toLowerCase(),
        "south africa",
        "buy dragon fruit",
        "dragon fruit plants",
        "dragon fruit cuttings",
        "pitaya farming"
      ].filter(Boolean),
      ogTitle: `${productName} - Dragon Fruit South Africa`,
      ogDescription: `Premium ${variety || 'dragon fruit'} from certified South African nursery. Fast nationwide delivery.`,
      structuredData: {
        "@type": "Product",
        "name": productName,
        "category": category || "Plants",
        "brand": "Dragon Fruit South Africa"
      }
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(seoData, null, 2)
      }]
    };
  }
});

// Tool: Get pricing strategy
mcpServer.tool({
  name: "get_pricing_strategy",
  description: "Get pricing recommendations for dragon fruit products",
  inputSchema: {
    type: "object",
    properties: {
      productType: { 
        type: "string", 
        description: "Type: cutting, rooted-plant, fruit-kg, consulting" 
      },
      variety: { type: "string", description: "Variety affects premium pricing" },
      quantity: { type: "number", description: "Bulk quantity for discount calculation" }
    },
    required: ["productType"]
  },
  handler: async ({ productType, variety, quantity }) => {
    const basePrices = {
      "cutting": { min: 50, standard: 80, premium: 150 },
      "rooted-plant": { min: 120, standard: 180, premium: 350 },
      "fruit-kg": { min: 80, standard: 120, premium: 200 },
      "consulting": { min: 500, standard: 1500, premium: 5000 }
    };

    const varietyMultiplier = {
      "yellow-dragon": 1.8,
      "red-flesh": 1.3,
      "vietnamese-white": 1.0
    };

    const bulkDiscounts = [
      { minQty: 100, discount: 0.25 },
      { minQty: 50, discount: 0.15 },
      { minQty: 20, discount: 0.10 },
      { minQty: 10, discount: 0.05 }
    ];

    const base = basePrices[productType as keyof typeof basePrices] || basePrices["cutting"];
    const multiplier = varietyMultiplier[variety as keyof typeof varietyMultiplier] || 1.0;
    
    let discount = 0;
    if (quantity) {
      const applicableDiscount = bulkDiscounts.find(d => quantity >= d.minQty);
      discount = applicableDiscount?.discount || 0;
    }

    const pricing = {
      basePrice: Math.round(base.standard * multiplier),
      premiumPrice: Math.round(base.premium * multiplier),
      budgetPrice: Math.round(base.min * multiplier),
      bulkDiscount: `${discount * 100}%`,
      bulkPrice: quantity ? Math.round(base.standard * multiplier * (1 - discount)) : null,
      recommendations: [
        "Set premium price for website, offer discounts for bulk orders",
        "Consider seasonal pricing - higher in spring planting season",
        "Bundle products for higher average order value",
        variety === "yellow-dragon" ? "Yellow dragon commands 50-80% premium" : null
      ].filter(Boolean)
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(pricing, null, 2)
      }]
    };
  }
});

// Tool: Inventory recommendations
mcpServer.tool({
  name: "get_inventory_advice",
  description: "Get inventory management recommendations based on season and demand patterns",
  inputSchema: {
    type: "object",
    properties: {
      currentMonth: { type: "number", description: "Current month (1-12)" },
      productType: { type: "string", description: "Product type" }
    },
    required: ["currentMonth"]
  },
  handler: async ({ currentMonth, productType }) => {
    const seasonalDemand = {
      1: { demand: "medium", note: "Post-holiday, new year resolutions" },
      2: { demand: "medium", note: "Summer continues, focus on care products" },
      3: { demand: "low", note: "Autumn approaching, harvest season ending" },
      4: { demand: "low", note: "Slow season, prepare for winter" },
      5: { demand: "low", note: "Winter prep, protect existing stock" },
      6: { demand: "low", note: "Dormant period, minimal sales" },
      7: { demand: "low", note: "Mid-winter, focus on planning" },
      8: { demand: "medium", note: "Early orders for spring planting" },
      9: { demand: "high", note: "PEAK SEASON - Spring planting begins" },
      10: { demand: "high", note: "Peak planting continues" },
      11: { demand: "high", note: "Last planting window before summer" },
      12: { demand: "medium", note: "Holiday season, gift purchases" }
    };

    const monthData = seasonalDemand[currentMonth as keyof typeof seasonalDemand];
    
    const advice = {
      currentDemand: monthData.demand,
      seasonNote: monthData.note,
      stockRecommendations: {
        high: "Ensure 150% of normal stock levels",
        medium: "Maintain 100% stock levels",
        low: "Reduce to 50% stock, focus on propagation"
      }[monthData.demand],
      actionItems: monthData.demand === "high" 
        ? ["Prepare additional cuttings", "Stock packaging materials", "Brief shipping partners", "Enable backorder system"]
        : monthData.demand === "low"
        ? ["Focus on mother plant care", "Prepare cuttings for spring", "Update product photos", "Plan marketing campaigns"]
        : ["Maintain steady operations", "Monitor stock levels weekly", "Prepare for demand changes"]
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(advice, null, 2)
      }]
    };
  }
});

const transport = new StreamableHttpTransport();

app.all("/*", async (c) => {
  return await transport.handleRequest(c.req.raw, mcpServer);
});

Deno.serve(app.fetch);
