import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const shippingZones: Record<string, any> = {
  gauteng: { baseRate: 85, perKg: 8, days: "1-2" },
  "western-cape": { baseRate: 120, perKg: 12, days: "2-3" },
  kzn: { baseRate: 110, perKg: 10, days: "2-3" },
  "eastern-cape": { baseRate: 130, perKg: 12, days: "3-4" },
  "free-state": { baseRate: 100, perKg: 10, days: "2-3" },
  limpopo: { baseRate: 110, perKg: 10, days: "2-3" },
  mpumalanga: { baseRate: 95, perKg: 9, days: "2-3" },
  "north-west": { baseRate: 105, perKg: 10, days: "2-3" },
  "northern-cape": { baseRate: 150, perKg: 15, days: "3-5" }
};

const suppliers: Record<string, any[]> = {
  trellising: [
    { name: "Agri Poles SA", location: "Johannesburg", products: ["Concrete poles", "Steel poles"], rating: 4.5 },
    { name: "Farm Wire Supplies", location: "Pretoria", products: ["High tensile wire", "Support wire"], rating: 4.3 }
  ],
  irrigation: [
    { name: "Netafim SA", location: "National", products: ["Drip irrigation", "Controllers"], rating: 4.8 },
    { name: "Irrigation Direct", location: "Cape Town", products: ["Budget drip kits", "Timers"], rating: 4.0 }
  ],
  fertilizers: [
    { name: "Kynoch Fertilizers", location: "National", products: ["NPK blends", "Calcium nitrate"], rating: 4.6 },
    { name: "Organics SA", location: "KZN", products: ["Organic compost", "Seaweed extract"], rating: 4.4 }
  ],
  packaging: [
    { name: "Mpact Packaging", location: "National", products: ["Fruit boxes", "Clamshells"], rating: 4.5 }
  ]
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tool, params } = await req.json();
    let result: any;

    switch (tool) {
      case "calculate_shipping_cost": {
        const weight = params?.weight || 1;
        const origin = params?.origin?.toLowerCase() || "pretoria";
        const destination = params?.destination?.toLowerCase() || "cape town";
        const express = params?.express || false;
        const coldChain = params?.coldChain || false;
        
        // Find destination zone
        let zone = shippingZones.gauteng;
        for (const [key, data] of Object.entries(shippingZones)) {
          if (destination.includes(key.replace("-", " ")) || destination.includes(key)) {
            zone = data;
            break;
          }
        }
        
        let cost = zone.baseRate + (weight * zone.perKg);
        if (coldChain) cost *= 1.5;
        if (express) cost *= 1.3;
        
        // Volume discount
        let discount = 0;
        if (weight >= 50) discount = 0.15;
        else if (weight >= 20) discount = 0.10;
        else if (weight >= 10) discount = 0.05;
        
        const finalCost = Math.round(cost * (1 - discount));
        
        result = {
          success: true,
          data: {
            origin,
            destination,
            weight: `${weight}kg`,
            deliveryDays: express ? "1 day" : zone.days + " days",
            baseCost: zone.baseRate,
            weightCost: weight * zone.perKg,
            coldChainSurcharge: coldChain ? "50%" : "N/A",
            expressSurcharge: express ? "30%" : "N/A",
            volumeDiscount: discount > 0 ? `${discount * 100}%` : "None",
            totalCost: finalCost
          }
        };
        break;
      }

      case "find_optimal_warehouse": {
        const customerLocations = params?.customerLocations || ["johannesburg", "cape town"];
        const needsColdStorage = params?.needsColdStorage || false;
        
        const warehouses = [
          { city: "Johannesburg", province: "gauteng", coldStorage: true, score: 0 },
          { city: "Cape Town", province: "western-cape", coldStorage: true, score: 0 },
          { city: "Durban", province: "kzn", coldStorage: true, score: 0 },
          { city: "Pretoria", province: "gauteng", coldStorage: false, score: 0 },
          { city: "Bloemfontein", province: "free-state", coldStorage: false, score: 0 }
        ];
        
        warehouses.forEach(wh => {
          customerLocations.forEach((loc: string) => {
            if (loc.toLowerCase().includes(wh.province) || loc.toLowerCase().includes(wh.city.toLowerCase())) {
              wh.score += 10;
            }
          });
          if (wh.province === "gauteng") wh.score += 5; // Central location bonus
          if (needsColdStorage && !wh.coldStorage) wh.score -= 100;
        });
        
        warehouses.sort((a, b) => b.score - a.score);
        
        result = {
          success: true,
          data: {
            customerLocations,
            recommendations: warehouses.slice(0, 3).map((wh, i) => ({
              rank: i + 1,
              city: wh.city,
              province: wh.province,
              coldStorage: wh.coldStorage,
              score: wh.score
            }))
          }
        };
        break;
      }

      case "get_supplier_recommendations": {
        const category = params?.category?.toLowerCase() || "trellising";
        
        const categorySuppliers = suppliers[category];
        if (!categorySuppliers) {
          result = {
            success: false,
            error: `Unknown category. Available: ${Object.keys(suppliers).join(", ")}`
          };
          break;
        }
        
        result = {
          success: true,
          data: {
            category,
            suppliers: categorySuppliers,
            tips: [
              "Always ask for quantity discounts",
              "Request samples before large orders",
              "Build relationships with suppliers"
            ]
          }
        };
        break;
      }

      case "inventory_forecast": {
        const currentStock = params?.currentStock || 100;
        const weeklyDemand = params?.weeklyDemand || 20;
        const leadTimeWeeks = params?.leadTimeWeeks || 2;
        
        const weeksOfStock = currentStock / weeklyDemand;
        const reorderPoint = Math.ceil(weeklyDemand * leadTimeWeeks * 1.2);
        const shouldReorder = currentStock <= reorderPoint;
        
        result = {
          success: true,
          data: {
            currentStock,
            weeklyDemand,
            weeksOfStock: Math.round(weeksOfStock * 10) / 10,
            reorderPoint,
            shouldReorder,
            suggestedOrderQuantity: Math.ceil(weeklyDemand * 4),
            status: shouldReorder ? "REORDER NOW" : "Stock healthy"
          }
        };
        break;
      }

      case "list_tools": {
        result = {
          success: true,
          tools: [
            { name: "calculate_shipping_cost", params: ["weight", "origin", "destination", "express", "coldChain"] },
            { name: "find_optimal_warehouse", params: ["customerLocations", "needsColdStorage"] },
            { name: "get_supplier_recommendations", params: ["category"] },
            { name: "inventory_forecast", params: ["currentStock", "weeklyDemand", "leadTimeWeeks"] }
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
