import { Hono } from "npm:hono@4";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";

const app = new Hono();

const mcpServer = new McpServer({
  name: "supply-chain-optimization-mcp",
  version: "1.0.0",
});

// South African logistics data
const shippingZones = {
  "gauteng": { baseRate: 85, weightRate: 8, days: "1-2" },
  "western-cape": { baseRate: 120, weightRate: 12, days: "2-3" },
  "kzn": { baseRate: 110, weightRate: 10, days: "2-3" },
  "eastern-cape": { baseRate: 130, weightRate: 12, days: "3-4" },
  "free-state": { baseRate: 100, weightRate: 10, days: "2-3" },
  "limpopo": { baseRate: 110, weightRate: 10, days: "2-3" },
  "mpumalanga": { baseRate: 95, weightRate: 9, days: "2-3" },
  "north-west": { baseRate: 105, weightRate: 10, days: "2-3" },
  "northern-cape": { baseRate: 150, weightRate: 15, days: "3-5" }
};

// Supplier database
const suppliers = {
  "trellising": [
    {
      name: "Agri Poles SA",
      location: "Johannesburg",
      products: ["Concrete poles", "Wooden poles", "Steel poles"],
      priceRange: "R80-150 per pole",
      minimumOrder: "50 poles",
      rating: 4.5,
      contact: "info@agripoles.co.za"
    },
    {
      name: "Farm Wire Supplies",
      location: "Pretoria",
      products: ["High tensile wire", "Support wire", "Training wire"],
      priceRange: "R500-800 per roll",
      minimumOrder: "10 rolls",
      rating: 4.3,
      contact: "sales@farmwire.co.za"
    }
  ],
  "irrigation": [
    {
      name: "Netafim SA",
      location: "National",
      products: ["Drip irrigation", "Micro-sprinklers", "Controllers"],
      priceRange: "Premium pricing",
      minimumOrder: "1 system",
      rating: 4.8,
      contact: "info@netafim.co.za"
    },
    {
      name: "Irrigation Direct",
      location: "Cape Town",
      products: ["Budget drip kits", "Timers", "Fittings"],
      priceRange: "Budget-friendly",
      minimumOrder: "R500",
      rating: 4.0,
      contact: "orders@irrigationdirect.co.za"
    }
  ],
  "fertilizers": [
    {
      name: "Kynoch Fertilizers",
      location: "National",
      products: ["NPK blends", "Calcium nitrate", "Potassium sulphate"],
      priceRange: "Competitive",
      minimumOrder: "25kg bags",
      rating: 4.6,
      contact: "info@kynoch.co.za"
    },
    {
      name: "Organics SA",
      location: "KZN",
      products: ["Organic compost", "Bone meal", "Seaweed extract"],
      priceRange: "R50-200 per bag",
      minimumOrder: "10 bags",
      rating: 4.4,
      contact: "organic@organicsa.co.za"
    }
  ],
  "packaging": [
    {
      name: "Mpact Packaging",
      location: "National",
      products: ["Fruit boxes", "Trays", "Clamshells"],
      priceRange: "Volume pricing",
      minimumOrder: "500 units",
      rating: 4.5,
      contact: "sales@mpact.co.za"
    }
  ]
};

// Warehouse locations
const warehouseLocations = [
  { city: "Johannesburg", province: "gauteng", capacity: "large", coldStorage: true },
  { city: "Cape Town", province: "western-cape", capacity: "large", coldStorage: true },
  { city: "Durban", province: "kzn", capacity: "medium", coldStorage: true },
  { city: "Pretoria", province: "gauteng", capacity: "medium", coldStorage: false },
  { city: "Bloemfontein", province: "free-state", capacity: "small", coldStorage: false }
];

// Tool: Calculate shipping cost
mcpServer.tool({
  name: "calculate_shipping_cost",
  description: "Calculate shipping cost for dragon fruit products",
  inputSchema: {
    type: "object",
    properties: {
      destinationProvince: { 
        type: "string", 
        description: "Province: gauteng, western-cape, kzn, eastern-cape, free-state, limpopo, mpumalanga, north-west, northern-cape" 
      },
      weightKg: { type: "number", description: "Total weight in kg" },
      requiresColdChain: { type: "boolean", description: "Requires refrigerated shipping" },
      isExpress: { type: "boolean", description: "Express/overnight delivery" }
    },
    required: ["destinationProvince", "weightKg"]
  },
  handler: async ({ destinationProvince, weightKg, requiresColdChain, isExpress }) => {
    const zone = shippingZones[destinationProvince as keyof typeof shippingZones];
    
    if (!zone) {
      return {
        content: [{
          type: "text",
          text: `Unknown province: ${destinationProvince}. Valid options: ${Object.keys(shippingZones).join(", ")}`
        }]
      };
    }

    let cost = zone.baseRate + (weightKg * zone.weightRate);
    
    if (requiresColdChain) {
      cost *= 1.5; // 50% surcharge for cold chain
    }
    
    if (isExpress) {
      cost *= 1.3; // 30% surcharge for express
    }

    // Volume discounts
    let discount = 0;
    if (weightKg >= 50) discount = 0.15;
    else if (weightKg >= 20) discount = 0.10;
    else if (weightKg >= 10) discount = 0.05;

    const finalCost = cost * (1 - discount);

    const result = {
      destinationProvince,
      weight: `${weightKg}kg`,
      estimatedDays: isExpress ? "1 day" : zone.days + " days",
      baseCost: `R${zone.baseRate}`,
      weightCost: `R${(weightKg * zone.weightRate).toFixed(2)}`,
      coldChainSurcharge: requiresColdChain ? "50%" : "N/A",
      expressSurcharge: isExpress ? "30%" : "N/A",
      volumeDiscount: discount > 0 ? `${discount * 100}%` : "None",
      totalCost: `R${finalCost.toFixed(2)}`,
      recommendations: [
        weightKg < 5 ? "Consider combining with other orders to reduce per-unit cost" : null,
        requiresColdChain ? "Ensure recipient is available to receive - cold chain sensitive" : null,
        !isExpress && zone.days.includes("3") ? "Consider express for longer distances to maintain freshness" : null
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

// Tool: Find optimal warehouse
mcpServer.tool({
  name: "find_optimal_warehouse",
  description: "Find the optimal warehouse location based on customer distribution",
  inputSchema: {
    type: "object",
    properties: {
      customerProvinces: { 
        type: "array",
        items: { type: "string" },
        description: "List of provinces where customers are located" 
      },
      requiresColdStorage: { type: "boolean", description: "Needs cold storage capability" },
      volumeLevel: { type: "string", description: "Volume: small, medium, large" }
    },
    required: ["customerProvinces"]
  },
  handler: async ({ customerProvinces, requiresColdStorage, volumeLevel }) => {
    const provinceFrequency: Record<string, number> = {};
    customerProvinces.forEach((p: string) => {
      provinceFrequency[p.toLowerCase()] = (provinceFrequency[p.toLowerCase()] || 0) + 1;
    });

    // Score each warehouse
    const warehouseScores = warehouseLocations.map(wh => {
      let score = 0;
      
      // Location score - higher for provinces with more customers
      const provinceCustomers = provinceFrequency[wh.province] || 0;
      score += provinceCustomers * 10;

      // Cold storage requirement
      if (requiresColdStorage && !wh.coldStorage) {
        score -= 100; // Major penalty
      }

      // Capacity match
      const capacityMatch = {
        small: { small: 10, medium: 5, large: 0 },
        medium: { small: -10, medium: 10, large: 5 },
        large: { small: -20, medium: 0, large: 10 }
      };
      score += capacityMatch[volumeLevel as keyof typeof capacityMatch]?.[wh.capacity] || 0;

      // Central location bonus
      if (wh.province === "gauteng") score += 5;
      if (wh.province === "free-state") score += 3;

      return { ...wh, score };
    });

    // Sort by score
    warehouseScores.sort((a, b) => b.score - a.score);

    const result = {
      customerDistribution: provinceFrequency,
      recommendedWarehouses: warehouseScores.slice(0, 3).map((wh, i) => ({
        rank: i + 1,
        city: wh.city,
        province: wh.province,
        capacity: wh.capacity,
        coldStorage: wh.coldStorage,
        score: wh.score,
        reasoning: i === 0 ? "Best match for your customer base and requirements" : "Alternative option"
      })),
      considerations: [
        requiresColdStorage ? "Cold storage is essential for fresh fruit" : "Cuttings can ship without cold storage",
        Object.keys(provinceFrequency).length > 3 ? "Consider multiple distribution points for efficiency" : "Single warehouse may suffice"
      ]
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
});

// Tool: Get supplier recommendations
mcpServer.tool({
  name: "get_supplier_recommendations",
  description: "Get recommended suppliers for farming inputs",
  inputSchema: {
    type: "object",
    properties: {
      category: { 
        type: "string", 
        description: "Category: trellising, irrigation, fertilizers, packaging" 
      },
      province: { type: "string", description: "Your province for location-based matching" },
      budget: { type: "string", description: "Budget level: budget, standard, premium" }
    },
    required: ["category"]
  },
  handler: async ({ category, province, budget }) => {
    const categorySuppliers = suppliers[category as keyof typeof suppliers];
    
    if (!categorySuppliers) {
      return {
        content: [{
          type: "text",
          text: `Unknown category: ${category}. Available: ${Object.keys(suppliers).join(", ")}`
        }]
      };
    }

    const result = {
      category,
      suppliers: categorySuppliers,
      tips: {
        trellising: "Order poles early - 2-3 week lead time. Compare concrete vs wood for your climate.",
        irrigation: "Invest in quality emitters - clogs are costly. Consider solar pump for remote areas.",
        fertilizers: "Start with soil test. Focus on potassium during fruiting.",
        packaging: "Match packaging to market - export needs specific standards."
      }[category],
      negotiationTips: [
        "Always ask for quantity discounts",
        "Request samples before large orders",
        "Build relationships - suppliers often help troubleshoot",
        "Compare at least 3 suppliers before committing"
      ]
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
});

// Tool: Optimize route
mcpServer.tool({
  name: "optimize_delivery_route",
  description: "Optimize delivery route for multiple destinations",
  inputSchema: {
    type: "object",
    properties: {
      originProvince: { type: "string", description: "Starting province" },
      destinations: { 
        type: "array",
        items: { type: "string" },
        description: "List of destination provinces" 
      }
    },
    required: ["originProvince", "destinations"]
  },
  handler: async ({ originProvince, destinations }) => {
    // Simple optimization based on proximity groupings
    const regionGroups = {
      north: ["gauteng", "limpopo", "mpumalanga", "north-west"],
      central: ["free-state", "northern-cape"],
      east: ["kzn", "eastern-cape"],
      west: ["western-cape"]
    };

    // Group destinations by region
    const grouped: Record<string, string[]> = {};
    destinations.forEach((dest: string) => {
      for (const [region, provinces] of Object.entries(regionGroups)) {
        if (provinces.includes(dest.toLowerCase())) {
          if (!grouped[region]) grouped[region] = [];
          grouped[region].push(dest);
          break;
        }
      }
    });

    // Estimate total cost
    const totalCost = destinations.reduce((sum: number, dest: string) => {
      const zone = shippingZones[dest.toLowerCase() as keyof typeof shippingZones];
      return sum + (zone?.baseRate || 100);
    }, 0);

    const result = {
      origin: originProvince,
      totalDestinations: destinations.length,
      estimatedTotalCost: `R${totalCost}`,
      routeOptimization: {
        groupedByRegion: grouped,
        recommendation: Object.keys(grouped).length > 2 
          ? "Consider regional consolidation - use couriers with hub networks"
          : "Direct shipping is efficient for this route"
      },
      shippingDays: {
        fastest: "1-2 days (Gauteng region)",
        longest: "3-5 days (Northern Cape)"
      },
      costSavingTips: [
        "Batch orders to same region",
        "Use slower service for non-perishables",
        "Negotiate rates with couriers for regular volumes"
      ]
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
