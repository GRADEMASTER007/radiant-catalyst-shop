import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Dragon fruit variety database
const varieties: Record<string, any> = {
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
  },
  "red-dragon": {
    name: "Red Dragon (Hylocereus polyrhizus)",
    description: "Pink skin with red flesh, popular variety",
    sweetness: "Sweet, 16-20 Brix",
    climate: "Tropical to subtropical",
    harvestTime: "40-45 days after flowering",
    pollinationNeeds: "Cross-pollination recommended",
    yieldPerPlant: "18-28 kg per year when mature",
    tips: ["Popular in Asian markets", "Good disease resistance", "Attractive color"]
  }
};

// Pest and disease database
const pestTreatments: Record<string, any> = {
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
const seasonalAdvice: Record<string, any> = {
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tool, params } = await req.json();
    let result: any;

    switch (tool) {
      case "get_variety_info": {
        const variety = params?.variety?.toLowerCase().replace(/\s+/g, '-');
        const info = varieties[variety];
        if (info) {
          result = { success: true, data: info };
        } else {
          result = { 
            success: false, 
            error: `Unknown variety. Available: ${Object.keys(varieties).join(", ")}`,
            availableVarieties: Object.keys(varieties)
          };
        }
        break;
      }

      case "get_pest_treatment": {
        const pest = params?.pest?.toLowerCase().replace(/\s+/g, '-');
        const treatment = pestTreatments[pest];
        if (treatment) {
          result = { success: true, data: treatment };
        } else {
          result = { 
            success: false, 
            error: `Unknown pest/disease. Known issues: ${Object.keys(pestTreatments).join(", ")}`,
            availablePests: Object.keys(pestTreatments)
          };
        }
        break;
      }

      case "get_seasonal_advice": {
        const season = params?.season?.toLowerCase();
        const advice = seasonalAdvice[season];
        if (advice) {
          result = { success: true, data: advice };
        } else {
          result = { 
            success: false, 
            error: `Unknown season. Options: ${Object.keys(seasonalAdvice).join(", ")}`,
            availableSeasons: Object.keys(seasonalAdvice)
          };
        }
        break;
      }

      case "compare_varieties": {
        result = { success: true, data: varieties };
        break;
      }

      case "list_tools": {
        result = {
          success: true,
          tools: [
            { name: "get_variety_info", description: "Get info about a dragon fruit variety", params: ["variety"] },
            { name: "get_pest_treatment", description: "Get treatment for pests/diseases", params: ["pest"] },
            { name: "get_seasonal_advice", description: "Get seasonal farming advice", params: ["season"] },
            { name: "compare_varieties", description: "Compare all varieties", params: [] }
          ]
        };
        break;
      }

      default:
        result = { 
          success: false, 
          error: `Unknown tool: ${tool}. Use 'list_tools' to see available tools.`
        };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Internal server error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};

serve(handler);
