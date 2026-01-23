import { Hono } from "npm:hono@4";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";

const app = new Hono();

const mcpServer = new McpServer({
  name: "agricultural-knowledge-mcp",
  version: "1.0.0",
});

// Dragon fruit variety database
const varieties = {
  "vietnamese-white": {
    name: "Vietnamese White (Hylocereus undatus)",
    description: "Most common variety with white flesh and pink skin",
    sweetness: "Mild, 13-18 Brix",
    climate: "Subtropical to tropical, tolerates some cold",
    harvestTime: "45-50 days after flowering",
    pollinationNeeds: "Self-pollinating but cross-pollination improves yield",
    yieldPerPlant: "20-30 kg per year when mature",
    tips: ["Best for beginners", "Tolerates cooler nights", "Good for export markets"]
  },
  "red-flesh": {
    name: "Red Flesh (Hylocereus costaricensis)",
    description: "Deep magenta flesh with intense color",
    sweetness: "Sweet, 15-22 Brix",
    climate: "Tropical, requires warm nights",
    harvestTime: "40-45 days after flowering",
    pollinationNeeds: "Requires cross-pollination for best results",
    yieldPerPlant: "15-25 kg per year when mature",
    tips: ["Premium market prices", "High antioxidant content", "Requires hand pollination"]
  },
  "yellow-dragon": {
    name: "Yellow Dragon (Selenicereus megalanthus)",
    description: "Yellow skin with white flesh, thorny",
    sweetness: "Very sweet, 18-24 Brix",
    climate: "Cooler tropical, tolerates altitude",
    harvestTime: "150-180 days (longest cycle)",
    pollinationNeeds: "Self-pollinating",
    yieldPerPlant: "10-15 kg per year when mature",
    tips: ["Highest sugar content", "Best flavor profile", "Lower yield but premium prices"]
  }
};

// Pest and disease database
const pestTreatments = {
  "mealybugs": {
    symptoms: "White cottony masses on stems and fruit",
    organicTreatment: "Neem oil spray, introduce ladybugs, remove affected parts",
    chemicalTreatment: "Imidacloprid or spirotetramat-based insecticides",
    prevention: "Regular inspection, maintain plant hygiene, avoid over-fertilizing with nitrogen"
  },
  "scale-insects": {
    symptoms: "Brown or white bumps on stems, yellowing tissue",
    organicTreatment: "Horticultural oil, manual removal with brush, beneficial insects",
    chemicalTreatment: "Systemic insecticides during crawler stage",
    prevention: "Quarantine new plants, regular monitoring, prune affected areas"
  },
  "stem-rot": {
    symptoms: "Soft, brown, watery lesions on stems",
    organicTreatment: "Remove affected tissue, improve drainage, copper-based fungicides",
    chemicalTreatment: "Mancozeb or copper hydroxide",
    prevention: "Avoid overwatering, ensure good air circulation, avoid stem wounds"
  },
  "anthracnose": {
    symptoms: "Dark sunken spots on fruit and stems",
    organicTreatment: "Remove affected parts, copper sprays, improve air flow",
    chemicalTreatment: "Azoxystrobin or chlorothalonil",
    prevention: "Avoid overhead irrigation, harvest in dry conditions, maintain hygiene"
  },
  "fruit-fly": {
    symptoms: "Small punctures on fruit, larvae inside",
    organicTreatment: "Protein bait traps, netting, harvest early",
    chemicalTreatment: "Spinosad-based baits",
    prevention: "Remove fallen fruit, use exclusion bags, monitor with traps"
  }
};

// Seasonal advice for South Africa
const seasonalAdvice = {
  "summer": {
    months: "November - February",
    tasks: [
      "Peak flowering and fruiting season",
      "Hand pollinate at night (7pm-midnight) when flowers open",
      "Increase irrigation during hot spells",
      "Apply potassium-rich fertilizer for fruit development",
      "Monitor for fruit fly and install traps",
      "Harvest fruit when 4-5 days after color change"
    ],
    warnings: ["Sunburn protection may be needed", "Watch for stem rot in humid conditions"]
  },
  "autumn": {
    months: "March - May",
    tasks: [
      "Second flowering flush possible",
      "Reduce irrigation gradually",
      "Apply balanced fertilizer",
      "Prune excess growth after harvest",
      "Prepare structures for winter protection",
      "Take cuttings for propagation"
    ],
    warnings: ["Last harvest before cooler weather", "Treat any fungal issues before winter"]
  },
  "winter": {
    months: "June - August",
    tasks: [
      "Minimal irrigation - only when soil is dry",
      "No fertilizer during dormant period",
      "Protect from frost with covers or heating",
      "Prune and train structures",
      "Plan next season's expansion",
      "Prepare new planting holes"
    ],
    warnings: ["Frost damage is the biggest risk", "Do not prune if frost is expected"]
  },
  "spring": {
    months: "September - October",
    tasks: [
      "Resume regular irrigation as growth starts",
      "Apply nitrogen-rich fertilizer to promote growth",
      "Install new support structures",
      "Plant new cuttings",
      "Monitor for emerging pests",
      "Prepare pollination equipment"
    ],
    warnings: ["Late frost possible in some areas", "Avoid over-fertilizing new plants"]
  }
};

// Tool: Get variety information
mcpServer.tool({
  name: "get_variety_info",
  description: "Get detailed information about a specific dragon fruit variety including growing requirements, yield potential, and cultivation tips",
  inputSchema: {
    type: "object",
    properties: {
      variety: { 
        type: "string", 
        description: "Variety name: vietnamese-white, red-flesh, or yellow-dragon" 
      }
    },
    required: ["variety"]
  },
  handler: async ({ variety }) => {
    const info = varieties[variety as keyof typeof varieties];
    if (!info) {
      return {
        content: [{
          type: "text",
          text: `Unknown variety: ${variety}. Available varieties: vietnamese-white, red-flesh, yellow-dragon`
        }]
      };
    }
    return {
      content: [{
        type: "text",
        text: JSON.stringify(info, null, 2)
      }]
    };
  }
});

// Tool: Get pest treatment
mcpServer.tool({
  name: "get_pest_treatment",
  description: "Get treatment recommendations for dragon fruit pests and diseases",
  inputSchema: {
    type: "object",
    properties: {
      pest: { 
        type: "string", 
        description: "Pest or disease: mealybugs, scale-insects, stem-rot, anthracnose, fruit-fly" 
      }
    },
    required: ["pest"]
  },
  handler: async ({ pest }) => {
    const treatment = pestTreatments[pest as keyof typeof pestTreatments];
    if (!treatment) {
      return {
        content: [{
          type: "text",
          text: `Unknown pest/disease: ${pest}. Known issues: ${Object.keys(pestTreatments).join(", ")}`
        }]
      };
    }
    return {
      content: [{
        type: "text",
        text: JSON.stringify(treatment, null, 2)
      }]
    };
  }
});

// Tool: Get seasonal advice
mcpServer.tool({
  name: "get_seasonal_advice",
  description: "Get seasonal farming advice for dragon fruit cultivation in South Africa",
  inputSchema: {
    type: "object",
    properties: {
      season: { 
        type: "string", 
        description: "Season: summer, autumn, winter, or spring" 
      }
    },
    required: ["season"]
  },
  handler: async ({ season }) => {
    const advice = seasonalAdvice[season as keyof typeof seasonalAdvice];
    if (!advice) {
      return {
        content: [{
          type: "text",
          text: `Unknown season: ${season}. Options: summer, autumn, winter, spring`
        }]
      };
    }
    return {
      content: [{
        type: "text",
        text: JSON.stringify(advice, null, 2)
      }]
    };
  }
});

// Tool: Get all varieties comparison
mcpServer.tool({
  name: "compare_varieties",
  description: "Compare all dragon fruit varieties side by side",
  inputSchema: {
    type: "object",
    properties: {}
  },
  handler: async () => {
    return {
      content: [{
        type: "text",
        text: JSON.stringify(varieties, null, 2)
      }]
    };
  }
});

const transport = new StreamableHttpTransport();

app.all("/*", async (c) => {
  return await transport.handleRequest(c.req.raw, mcpServer);
});

Deno.serve(app.fetch);
