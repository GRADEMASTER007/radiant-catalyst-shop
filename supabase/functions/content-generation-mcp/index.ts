import { Hono } from "npm:hono@4";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";

const app = new Hono();

const mcpServer = new McpServer({
  name: "content-generation-mcp",
  version: "1.0.0",
});

// Content templates and generators
const articleTemplates = {
  "beginner-guide": {
    structure: ["Introduction", "Why Dragon Fruit?", "Getting Started", "First Steps", "Common Mistakes", "Conclusion"],
    tone: "friendly and encouraging",
    wordCount: "1500-2000"
  },
  "variety-spotlight": {
    structure: ["Introduction", "Origin & History", "Characteristics", "Growing Requirements", "Taste & Uses", "Where to Buy"],
    tone: "informative and detailed",
    wordCount: "1000-1500"
  },
  "seasonal-guide": {
    structure: ["Season Overview", "Key Tasks", "Problems to Watch", "Tips for Success", "Checklist"],
    tone: "practical and actionable",
    wordCount: "800-1200"
  },
  "success-story": {
    structure: ["Background", "The Challenge", "The Solution", "Results", "Key Takeaways", "Advice for Others"],
    tone: "inspiring and personal",
    wordCount: "1200-1800"
  }
};

// Tool: Generate article outline
mcpServer.tool({
  name: "generate_article",
  description: "Generate a complete blog article about dragon fruit topics",
  inputSchema: {
    type: "object",
    properties: {
      topic: { type: "string", description: "Article topic" },
      articleType: { 
        type: "string", 
        description: "Type: beginner-guide, variety-spotlight, seasonal-guide, success-story" 
      },
      targetAudience: { type: "string", description: "Target audience: beginner, intermediate, commercial" },
      includeKeywords: { 
        type: "array",
        items: { type: "string" },
        description: "SEO keywords to include" 
      }
    },
    required: ["topic"]
  },
  handler: async ({ topic, articleType, targetAudience, includeKeywords }) => {
    const template = articleTemplates[articleType as keyof typeof articleTemplates] || articleTemplates["beginner-guide"];
    const audience = targetAudience || "beginner";
    const keywords = includeKeywords || ["dragon fruit", "pitaya", "South Africa", "farming"];

    // Generate article content
    const article = {
      title: `${topic}: A Complete Guide for ${audience === "beginner" ? "Beginners" : audience === "commercial" ? "Commercial Growers" : "Experienced Growers"}`,
      metaTitle: `${topic} | Dragon Fruit Farming South Africa`,
      metaDescription: `Learn about ${topic.toLowerCase()} from South Africa's leading dragon fruit experts. Practical tips for ${audience} growers.`,
      structure: template.structure,
      suggestedWordCount: template.wordCount,
      tone: template.tone,
      outline: template.structure.map((section, i) => ({
        section,
        order: i + 1,
        suggestedContent: generateSectionContent(topic, section, audience),
        keywords: keywords.slice(0, 2)
      })),
      seoOptimization: {
        primaryKeyword: keywords[0],
        secondaryKeywords: keywords.slice(1),
        suggestedInternalLinks: [
          "/products",
          "/consultations",
          "/business-resources"
        ],
        callToAction: audience === "commercial" 
          ? "Contact us for bulk orders and commercial consulting"
          : "Shop our premium cuttings to start your journey"
      },
      featuredImageSuggestion: `${topic.toLowerCase().replace(/\s+/g, '-')}-hero-image.jpg`,
      publishingNotes: [
        "Include at least 2-3 original photos",
        "Add alt text with keywords to all images",
        "Include internal links to product pages",
        "Share on social media within 24 hours of publishing"
      ]
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(article, null, 2)
      }]
    };
  }
});

function generateSectionContent(topic: string, section: string, audience: string): string {
  const contentHints: Record<string, string> = {
    "Introduction": `Open with a hook about ${topic}. Establish relevance for ${audience} readers. Preview what they'll learn.`,
    "Why Dragon Fruit?": `Cover market demand, health benefits, and profitability. Include South African context.`,
    "Getting Started": `Practical first steps. What to buy, where to plant, initial investment overview.`,
    "First Steps": `Step-by-step guide appropriate for ${audience} level. Include timeline expectations.`,
    "Common Mistakes": `List 5-7 mistakes to avoid. Be specific and solution-oriented.`,
    "Conclusion": `Summarize key points. Include strong CTA appropriate for ${audience}.`,
    "Origin & History": `Background on the variety. Interesting facts. Journey to South Africa.`,
    "Characteristics": `Detailed description. What makes it unique. Visual identification.`,
    "Growing Requirements": `Climate, soil, water, fertilizer needs. South African context.`,
    "Taste & Uses": `Flavor profile. Culinary uses. Nutritional benefits.`,
    "Where to Buy": `Direct CTA to purchase from DFSA. Link to product page.`,
    "Season Overview": `What to expect this season. Key dates and milestones.`,
    "Key Tasks": `Bulleted list of essential tasks. Prioritized by importance.`,
    "Problems to Watch": `Common issues this season. How to identify and address.`,
    "Tips for Success": `Expert advice. What separates successful growers.`,
    "Checklist": `Downloadable or printable checklist for the season.`,
    "Background": `Set the scene. Who is the farmer? Their starting point.`,
    "The Challenge": `What obstacles did they face? Relatable struggles.`,
    "The Solution": `How did they overcome? What worked?`,
    "Results": `Quantifiable outcomes. Before and after.`,
    "Key Takeaways": `Lessons others can apply. Actionable insights.`,
    "Advice for Others": `Direct quotes from the farmer. Wisdom to share.`
  };

  return contentHints[section] || `Write engaging content about ${section} related to ${topic}.`;
}

// Tool: Generate product description
mcpServer.tool({
  name: "generate_product_description",
  description: "Generate a compelling product description",
  inputSchema: {
    type: "object",
    properties: {
      productName: { type: "string", description: "Product name" },
      productType: { type: "string", description: "Type: cutting, plant, fruit, accessory" },
      features: { 
        type: "array",
        items: { type: "string" },
        description: "Key product features" 
      },
      pricePoint: { type: "string", description: "Price positioning: budget, standard, premium" }
    },
    required: ["productName", "productType"]
  },
  handler: async ({ productName, productType, features, pricePoint }) => {
    const descriptions = {
      cutting: {
        budget: `**${productName}**\n\nQuality dragon fruit cutting at an accessible price point. Perfect for first-time growers looking to start their collection without breaking the bank.\n\n${(features || []).map(f => `• ${f}`).join('\n')}\n\n*Note: Budget options may include smaller cuttings or minor cosmetic variations that don't affect growing potential.*`,
        standard: `**${productName}**\n\nPremium-grade dragon fruit cutting from our certified mother plants. Hand-selected for optimal rooting potential and genetic quality.\n\n**Specifications:**\n• Size: 30-40cm\n• Age: Fresh cut from mature plant\n• Health: Disease-free, inspected\n\n${(features || []).map(f => `✓ ${f}`).join('\n')}\n\n**Included:**\n• Detailed rooting guide\n• WhatsApp support\n• Replacement guarantee if DOA\n\n*Start your dragon fruit journey with genetics you can trust.*`,
        premium: `**${productName}** ⭐ Premium Selection\n\nOur finest cutting, selected from our highest-producing mother plants. For serious growers who demand the best genetics.\n\n**Why Premium?**\n• Top 10% of our production\n• Proven fruiting genetics\n• Thicker, more vigorous cutting\n• Priority shipping\n\n${(features || []).map(f => `★ ${f}`).join('\n')}\n\n**Premium Guarantee:**\nIf this cutting doesn't root within 6 weeks with proper care, we'll replace it FREE.\n\n*Excellence in every cutting.*`
      },
      plant: {
        standard: `**${productName}**\n\nReady-to-plant dragon fruit with established root system. Skip the rooting phase and accelerate your growing timeline.\n\n**Plant Details:**\n• Well-rooted in premium medium\n• 3-6 months established\n• Ready for direct planting\n• Hardened for outdoor conditions\n\n${(features || []).map(f => `✓ ${f}`).join('\n')}\n\n**Expected Timeline:**\n• Transplant: Immediate\n• New growth: 2-4 weeks\n• First fruit: 12-18 months\n\n*Perfect for growers who want a head start!*`
      }
    };

    const typeDescriptions = descriptions[productType as keyof typeof descriptions];
    const description = typeDescriptions?.[pricePoint as keyof typeof typeDescriptions] || 
      typeDescriptions?.standard ||
      `**${productName}**\n\n${(features || ["Quality product"]).map(f => `• ${f}`).join('\n')}`;

    return {
      content: [{
        type: "text",
        text: description
      }]
    };
  }
});

// Tool: Create social media content
mcpServer.tool({
  name: "create_social_media_content",
  description: "Create social media posts for various platforms",
  inputSchema: {
    type: "object",
    properties: {
      platform: { 
        type: "string", 
        description: "Platform: instagram, facebook, twitter, whatsapp" 
      },
      contentType: { 
        type: "string", 
        description: "Type: product-promo, educational, behind-scenes, customer-story" 
      },
      topic: { type: "string", description: "Topic or product to promote" },
      includeEmojis: { type: "boolean", description: "Include emojis in the content" }
    },
    required: ["platform", "contentType"]
  },
  handler: async ({ platform, contentType, topic, includeEmojis }) => {
    const emojis = includeEmojis !== false;
    
    const templates: Record<string, Record<string, string>> = {
      instagram: {
        "product-promo": `${emojis ? '🐉✨' : ''} NEW IN STOCK: ${topic || 'Premium Dragon Fruit Cuttings'}\n\nFresh from our nursery to your garden. Each cutting is hand-selected for:\n${emojis ? '✓' : '-'} Proven genetics\n${emojis ? '✓' : '-'} Disease-free health\n${emojis ? '✓' : '-'} Optimal rooting potential\n\n${emojis ? '📦' : ''} Nationwide delivery\n${emojis ? '💬' : ''} WhatsApp support included\n\nTap link in bio to shop!\n\n#DragonFruit #Pitaya #SouthAfrican #UrbanFarming #GrowYourOwn #DragonFruitSA #FruitTrees #Gardening`,
        "educational": `${emojis ? '📚🌱' : ''} DID YOU KNOW?\n\n${topic || 'Dragon fruit flowers only open for ONE night!'}\n\nThat's why hand pollination between 8pm-midnight is crucial for fruit set. Here's how:\n\n1️⃣ Wait for flower to fully open\n2️⃣ Collect pollen with brush\n3️⃣ Transfer to another flower's stigma\n4️⃣ Repeat with multiple flowers\n\nSave this post for later! ${emojis ? '📌' : ''}\n\n#DragonFruitTips #GrowingTips #Gardening101 #LearnToGrow #PlantEducation`,
        "behind-scenes": `${emojis ? '👀 BTS at the nursery!' : 'Behind the scenes at our nursery'}\n\n${topic || 'Morning harvest time - selecting the best cuttings for our customers.'}\n\nEvery cutting goes through:\n${emojis ? '🔍' : '1.'} Visual inspection\n${emojis ? '📏' : '2.'} Size verification\n${emojis ? '✅' : '3.'} Health check\n${emojis ? '📦' : '4.'} Careful packaging\n\nThis is why our customers have 95%+ rooting success!\n\n#Nursery #PlantCare #SmallBusiness #SouthAfrican #QualityFirst`
      },
      facebook: {
        "product-promo": `${emojis ? '🌟' : ''} Fresh Stock Alert!\n\n${topic || 'Premium Dragon Fruit Cuttings'} now available.\n\nWhy choose us?\n• Certified disease-free stock\n• Proven South African growing conditions\n• Full support from planting to harvest\n• Nationwide delivery\n\nOrder now: [link]\nQuestions? Message us or call.\n\n${emojis ? '🚚 Free shipping on orders over R500!' : 'Free shipping on orders over R500!'}`,
        "educational": `${topic || 'Winter Care Guide for Dragon Fruit'}\n\n${emojis ? '❄️' : ''} As temperatures drop, protect your investment:\n\n1. Reduce watering - soil should be barely moist\n2. No fertilizer during dormancy\n3. Cover if frost expected (below 2°C)\n4. Avoid pruning until spring\n5. Check for rot from excess moisture\n\nNeed help with your plants? Comment below or message us!\n\n#DragonFruit #WinterCare #GardeningTips`
      },
      whatsapp: {
        "product-promo": `${emojis ? '🐉' : ''} *${topic || 'Dragon Fruit Cuttings'}*\n\nHi! Fresh stock just arrived.\n\n*What's included:*\n- Premium cutting (30-40cm)\n- Rooting guide\n- WhatsApp support\n\n*Prices:*\n- White: R80\n- Red: R100\n- Yellow: R150\n\n${emojis ? '📦' : ''} Nationwide delivery available\n\nReply to order or ask questions!`
      }
    };

    const content = templates[platform]?.[contentType] || 
      `${emojis ? '🐉' : ''} ${topic || 'Dragon Fruit South Africa'}\n\nLearn more at dragonfruitsouthafrica.com`;

    const result = {
      platform,
      contentType,
      post: content,
      bestTimeToPost: {
        instagram: "6-9 AM or 7-9 PM weekdays",
        facebook: "1-4 PM weekdays",
        twitter: "12-1 PM weekdays",
        whatsapp: "9-11 AM or 4-6 PM"
      }[platform],
      hashtagLimit: platform === "instagram" ? "30 (use 15-20)" : platform === "twitter" ? "2-3" : "None needed",
      characterLimit: platform === "twitter" ? "280" : "Flexible",
      tips: [
        "Include a clear call-to-action",
        "Use high-quality images",
        "Respond to comments quickly",
        platform === "instagram" ? "Use Stories to boost engagement" : null
      ].filter(Boolean)
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
});

const transport = new StreamableHttpTransport();

app.all("/*", async (c) => {
  return await transport.handleRequest(c.req.raw, mcpServer);
});

Deno.serve(app.fetch);
