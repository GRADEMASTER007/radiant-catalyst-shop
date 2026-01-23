import { Hono } from "npm:hono@4";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";

const app = new Hono();

const mcpServer = new McpServer({
  name: "financial-planning-mcp",
  version: "1.0.0",
});

// Tool: Calculate ROI
mcpServer.tool({
  name: "calculate_roi",
  description: "Calculate return on investment for dragon fruit farming",
  inputSchema: {
    type: "object",
    properties: {
      plantCount: { type: "number", description: "Number of plants" },
      variety: { 
        type: "string", 
        description: "Variety: vietnamese-white, red-flesh, yellow-dragon" 
      },
      landCostPerMonth: { type: "number", description: "Monthly land/rent cost in ZAR" },
      includeInfrastructure: { type: "boolean", description: "Include trellising and irrigation costs" }
    },
    required: ["plantCount"]
  },
  handler: async ({ plantCount, variety, landCostPerMonth, includeInfrastructure }) => {
    // Base costs per plant
    const plantCosts = {
      "vietnamese-white": 80,
      "red-flesh": 100,
      "yellow-dragon": 150
    };
    
    // Yield and price per variety (kg per plant per year, mature)
    const yields = {
      "vietnamese-white": { kg: 25, pricePerKg: 100 },
      "red-flesh": { kg: 20, pricePerKg: 150 },
      "yellow-dragon": { kg: 12, pricePerKg: 200 }
    };

    const selectedVariety = variety || "vietnamese-white";
    const plantCost = plantCosts[selectedVariety as keyof typeof plantCosts] || 80;
    const yieldData = yields[selectedVariety as keyof typeof yields] || yields["vietnamese-white"];

    // Capital costs
    const plantPurchase = plantCount * plantCost;
    const trellisPerPlant = includeInfrastructure ? 150 : 0; // Concrete pole + wire
    const irrigationPerPlant = includeInfrastructure ? 50 : 0; // Drip system
    const infrastructureCost = plantCount * (trellisPerPlant + irrigationPerPlant);
    
    // Annual operating costs
    const fertilizerPerPlant = 50; // Per year
    const waterPerPlant = 30; // Per year
    const laborPerPlant = 40; // Per year (part of larger operation)
    const annualLandCost = (landCostPerMonth || 0) * 12;
    const annualOpex = (plantCount * (fertilizerPerPlant + waterPerPlant + laborPerPlant)) + annualLandCost;

    // Revenue (mature plants - year 3+)
    const annualYield = plantCount * yieldData.kg;
    const grossRevenue = annualYield * yieldData.pricePerKg;
    const netAnnualProfit = grossRevenue - annualOpex;

    // Timeline
    const year1Revenue = 0; // Establishment
    const year2Revenue = grossRevenue * 0.3; // Partial yield
    const year3Revenue = grossRevenue * 0.7; // Near full
    const year4Revenue = grossRevenue; // Full production

    const totalInvestment = plantPurchase + infrastructureCost;
    const breakEvenYear = totalInvestment < (year2Revenue - annualOpex) 
      ? 2 
      : totalInvestment < (year2Revenue + year3Revenue - (annualOpex * 2))
        ? 3
        : 4;

    const fiveYearProfit = 
      -totalInvestment - annualOpex + // Year 1
      year2Revenue - annualOpex + // Year 2
      year3Revenue - annualOpex + // Year 3
      year4Revenue - annualOpex + // Year 4
      year4Revenue - annualOpex;  // Year 5

    const roi = {
      summary: {
        totalInvestment: `R${totalInvestment.toLocaleString()}`,
        annualOperatingCost: `R${annualOpex.toLocaleString()}`,
        matureAnnualRevenue: `R${grossRevenue.toLocaleString()}`,
        matureAnnualProfit: `R${netAnnualProfit.toLocaleString()}`,
        breakEvenYear: `Year ${breakEvenYear}`,
        fiveYearProfit: `R${fiveYearProfit.toLocaleString()}`
      },
      breakdown: {
        capitalCosts: {
          plants: `R${plantPurchase.toLocaleString()}`,
          infrastructure: `R${infrastructureCost.toLocaleString()}`
        },
        annualCosts: {
          fertilizer: `R${(plantCount * fertilizerPerPlant).toLocaleString()}`,
          water: `R${(plantCount * waterPerPlant).toLocaleString()}`,
          labor: `R${(plantCount * laborPerPlant).toLocaleString()}`,
          land: `R${annualLandCost.toLocaleString()}`
        },
        production: {
          variety: selectedVariety,
          yieldPerPlant: `${yieldData.kg}kg/year`,
          totalAnnualYield: `${annualYield}kg`,
          pricePerKg: `R${yieldData.pricePerKg}`
        }
      },
      projections: {
        year1: { revenue: "R0", profit: `-R${(totalInvestment + annualOpex).toLocaleString()}` },
        year2: { revenue: `R${year2Revenue.toLocaleString()}`, profit: `R${(year2Revenue - annualOpex).toLocaleString()}` },
        year3: { revenue: `R${year3Revenue.toLocaleString()}`, profit: `R${(year3Revenue - annualOpex).toLocaleString()}` },
        year4: { revenue: `R${year4Revenue.toLocaleString()}`, profit: `R${(year4Revenue - annualOpex).toLocaleString()}` },
        year5: { revenue: `R${year4Revenue.toLocaleString()}`, profit: `R${(year4Revenue - annualOpex).toLocaleString()}` }
      },
      notes: [
        "Figures assume optimal growing conditions",
        "Prices based on current market rates",
        "Yields reach maturity in year 3-4",
        "Consider crop insurance for risk management"
      ]
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(roi, null, 2)
      }]
    };
  }
});

// Tool: Get funding options
mcpServer.tool({
  name: "get_funding_options",
  description: "Get information about funding options for agricultural projects in South Africa",
  inputSchema: {
    type: "object",
    properties: {
      farmSize: { type: "string", description: "Size: small (1-50 plants), medium (51-500), large (500+)" },
      applicantType: { type: "string", description: "Type: individual, company, cooperative" }
    },
    required: ["farmSize"]
  },
  handler: async ({ farmSize, applicantType }) => {
    const fundingOptions = {
      government: [
        {
          name: "Land Bank Agricultural Loans",
          description: "Loans for emerging and commercial farmers",
          amounts: "R50,000 - R10 million",
          interest: "Prime + 1-3%",
          requirements: ["Business plan", "Proof of land access", "Financial projections"],
          website: "landbank.co.za"
        },
        {
          name: "DALRRD Grants (CASP)",
          description: "Comprehensive Agricultural Support Programme",
          amounts: "Varies by province",
          interest: "Grant - no repayment",
          requirements: ["Emerging farmer status", "Provincial application", "Project plan"],
          website: "dalrrd.gov.za"
        },
        {
          name: "IDC Agri-Business Funding",
          description: "Industrial Development Corporation agri loans",
          amounts: "R1 million+",
          interest: "Competitive rates",
          requirements: ["Viable business plan", "Job creation potential", "BEE compliance"],
          website: "idc.co.za"
        }
      ],
      private: [
        {
          name: "FNB Agriculture Finance",
          description: "Commercial bank agricultural loans",
          amounts: "R100,000+",
          interest: "Prime-linked",
          requirements: ["Credit history", "Collateral", "Business plan"],
          website: "fnb.co.za/agriculture"
        },
        {
          name: "Absa AgriBusiness",
          description: "Specialized agricultural banking",
          amounts: "R50,000+",
          interest: "Negotiable",
          requirements: ["Account holder", "Farming history preferred"],
          website: "absa.co.za"
        }
      ],
      alternative: [
        {
          name: "Crowdfunding (Thundafund, BackaBuddy)",
          description: "Community-supported agriculture funding",
          amounts: "Varies",
          interest: "Reward-based",
          requirements: ["Compelling story", "Marketing effort"]
        },
        {
          name: "Impact Investment Funds",
          description: "Social impact investors in agriculture",
          amounts: "R500,000+",
          interest: "Patient capital, equity share",
          requirements: ["Social/environmental impact", "Scalable model"]
        }
      ],
      recommendations: {
        small: ["Start with personal savings", "Consider DALRRD grants", "FNB small business loans"],
        medium: ["Land Bank is ideal", "IDC for expansion", "Mix of grants and loans"],
        large: ["IDC primary option", "Land Bank for land purchase", "Private equity for scale"]
      }
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          ...fundingOptions,
          recommendedFor: fundingOptions.recommendations[farmSize as keyof typeof fundingOptions.recommendations] || fundingOptions.recommendations.small
        }, null, 2)
      }]
    };
  }
});

// Tool: Create budget projection
mcpServer.tool({
  name: "create_budget_projection",
  description: "Create a detailed budget projection for a dragon fruit farming operation",
  inputSchema: {
    type: "object",
    properties: {
      plantCount: { type: "number", description: "Number of plants to establish" },
      monthlyBudget: { type: "number", description: "Available monthly budget in ZAR" },
      timelineMonths: { type: "number", description: "Project timeline in months (default 36)" }
    },
    required: ["plantCount"]
  },
  handler: async ({ plantCount, monthlyBudget, timelineMonths }) => {
    const months = timelineMonths || 36;
    
    // Monthly breakdown for establishment phase (months 1-6)
    const establishment = {
      month1: {
        tasks: ["Land preparation", "Trellis materials purchase"],
        costs: {
          trellisConcretePolles: plantCount * 80,
          wire: plantCount * 20,
          tools: 2000
        }
      },
      month2: {
        tasks: ["Install trellises", "Irrigation setup"],
        costs: {
          labor: plantCount * 15,
          irrigationMaterials: plantCount * 50,
          pump: 5000
        }
      },
      month3: {
        tasks: ["Purchase and plant cuttings"],
        costs: {
          plants: plantCount * 80,
          soilAmendments: plantCount * 10,
          mulch: plantCount * 5
        }
      },
      months4to6: {
        tasks: ["Establishment care", "Initial training"],
        monthlyCosts: {
          water: plantCount * 3,
          fertilizer: plantCount * 5,
          pest_control: plantCount * 2
        }
      }
    };

    // Calculate totals
    const totalMonth1 = Object.values(establishment.month1.costs).reduce((a, b) => a + b, 0);
    const totalMonth2 = Object.values(establishment.month2.costs).reduce((a, b) => a + b, 0);
    const totalMonth3 = Object.values(establishment.month3.costs).reduce((a, b) => a + b, 0);
    const monthlyOngoing = Object.values(establishment.months4to6.monthlyCosts).reduce((a, b) => a + b, 0);

    const totalEstablishment = totalMonth1 + totalMonth2 + totalMonth3 + (monthlyOngoing * 3);
    const totalYear1 = totalEstablishment + (monthlyOngoing * 6);
    const annualOperating = monthlyOngoing * 12 * 1.2; // 20% buffer

    // Cash flow projection
    const cashFlow = [];
    let cumulativeCost = 0;
    let cumulativeRevenue = 0;

    for (let m = 1; m <= months; m++) {
      let monthlyCost = monthlyOngoing;
      let monthlyRevenue = 0;

      if (m === 1) monthlyCost = totalMonth1;
      if (m === 2) monthlyCost = totalMonth2;
      if (m === 3) monthlyCost = totalMonth3;
      
      // Revenue starts month 18 at 10%, grows to 70% by month 30, 100% by month 36
      if (m >= 18) {
        const maturityFactor = Math.min(1, (m - 18) / 18);
        const fullMonthlyRevenue = (plantCount * 25 * 100) / 12; // 25kg at R100/kg per year
        monthlyRevenue = fullMonthlyRevenue * maturityFactor;
      }

      cumulativeCost += monthlyCost;
      cumulativeRevenue += monthlyRevenue;

      if (m % 6 === 0 || m === 1 || m === months) {
        cashFlow.push({
          month: m,
          monthlyCost: Math.round(monthlyCost),
          monthlyRevenue: Math.round(monthlyRevenue),
          cumulativeCost: Math.round(cumulativeCost),
          cumulativeRevenue: Math.round(cumulativeRevenue),
          netPosition: Math.round(cumulativeRevenue - cumulativeCost)
        });
      }
    }

    const budget = {
      projectSummary: {
        plantCount,
        timeline: `${months} months`,
        totalEstablishmentCost: `R${totalEstablishment.toLocaleString()}`,
        annualOperatingCost: `R${annualOperating.toLocaleString()}`,
        expectedBreakeven: "Month 30-36"
      },
      budgetFeasibility: monthlyBudget ? {
        requiredMonthlyBudget: `R${Math.round((totalYear1 / 12))}`,
        yourBudget: `R${monthlyBudget}`,
        feasible: monthlyBudget >= (totalYear1 / 12),
        recommendation: monthlyBudget >= (totalYear1 / 12) 
          ? "Budget is sufficient for this scale"
          : `Consider reducing to ${Math.floor(monthlyBudget * 12 / (totalYear1 / plantCount))} plants`
      } : null,
      establishmentPhase: establishment,
      cashFlowProjection: cashFlow,
      recommendations: [
        "Keep 3-month operating reserve",
        "Phase planting if budget is tight",
        "Consider starting with fewer plants and expanding",
        "Factor in unexpected costs (10-20% buffer)"
      ]
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(budget, null, 2)
      }]
    };
  }
});

const transport = new StreamableHttpTransport();

app.all("/*", async (c) => {
  return await transport.handleRequest(c.req.raw, mcpServer);
});

Deno.serve(app.fetch);
