import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tool, params } = await req.json();
    let result: any;

    switch (tool) {
      case "calculate_roi": {
        const investment = params?.investmentAmount || 50000;
        const expectedYield = params?.expectedYield || 2000; // kg/hectare
        const pricePerKg = params?.pricePerKg || 80;
        const years = params?.years || 5;
        
        const projections = [];
        let cumulative = -investment;
        
        for (let y = 1; y <= years; y++) {
          const yieldFactor = y === 1 ? 0 : y === 2 ? 0.3 : y === 3 ? 0.7 : 1;
          const revenue = expectedYield * pricePerKg * yieldFactor;
          const opex = investment * 0.15; // 15% annual operating
          const profit = revenue - opex;
          cumulative += profit;
          
          projections.push({ year: y, revenue: Math.round(revenue), profit: Math.round(profit), cumulative: Math.round(cumulative) });
        }
        
        const breakEven = projections.find(p => p.cumulative > 0)?.year || years + 1;
        const roi = Math.round((cumulative / investment) * 100);
        
        result = {
          success: true,
          data: {
            investment,
            expectedYield: `${expectedYield}kg/year`,
            pricePerKg: `R${pricePerKg}`,
            projections,
            breakEvenYear: breakEven,
            roiPercent: roi,
            summary: `R${investment.toLocaleString()} investment breaks even in year ${breakEven} with ${roi}% ROI over ${years} years.`
          }
        };
        break;
      }

      case "get_funding_options": {
        const amount = params?.amount || 100000;
        
        result = {
          success: true,
          data: {
            requestedAmount: amount,
            options: [
              { name: "Land Bank", type: "loan", max: 10000000, rate: "Prime + 2-4%", term: "5-15 years" },
              { name: "DALRRD CASP Grant", type: "grant", max: 200000, rate: "N/A", term: "N/A" },
              { name: "IDC Agri-Business", type: "loan", max: 3000000, rate: "Subsidized", term: "Varies" },
              { name: "FNB Agriculture", type: "loan", max: 5000000, rate: "Prime-linked", term: "1-10 years" }
            ],
            recommendation: amount < 500000 
              ? "Consider DALRRD grants for emerging farmers or micro-finance for faster approval."
              : "Land Bank or IDC offer competitive rates for larger agricultural projects."
          }
        };
        break;
      }

      case "create_budget_projection": {
        const hectares = params?.hectares || 1;
        const hasInfra = params?.existingInfrastructure || false;
        
        const startup = {
          landPrep: hasInfra ? 0 : 15000 * hectares,
          structures: 80000 * hectares,
          irrigation: hasInfra ? 10000 : 35000 * hectares,
          plants: 25000 * hectares,
          fencing: hasInfra ? 0 : 20000 * hectares,
          tools: 10000,
          contingency: 15000 * hectares
        };
        
        const annual = {
          labor: 48000 * hectares,
          fertilizers: 8000 * hectares,
          water: 6000 * hectares,
          maintenance: 5000 * hectares,
          marketing: 10000
        };
        
        const startupTotal = Object.values(startup).reduce((a, b) => a + b, 0);
        const annualTotal = Object.values(annual).reduce((a, b) => a + b, 0);
        
        result = {
          success: true,
          data: {
            hectares,
            existingInfrastructure: hasInfra,
            startupCosts: startup,
            startupTotal,
            annualCosts: annual,
            annualTotal,
            fiveYearTotal: startupTotal + annualTotal * 5,
            notes: ["Startup costs are one-time", "Annual costs from year 3", "Consider 10-20% buffer"]
          }
        };
        break;
      }

      case "list_tools": {
        result = {
          success: true,
          tools: [
            { name: "calculate_roi", params: ["investmentAmount", "expectedYield", "pricePerKg", "years"] },
            { name: "get_funding_options", params: ["amount", "purpose"] },
            { name: "create_budget_projection", params: ["hectares", "existingInfrastructure"] }
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
