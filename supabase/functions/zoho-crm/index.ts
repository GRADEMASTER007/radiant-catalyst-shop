import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZOHO_CLIENT_ID = Deno.env.get("ZOHO_CLIENT_ID");
const ZOHO_CLIENT_SECRET = Deno.env.get("ZOHO_CLIENT_SECRET");
const ZOHO_API_BASE = "https://www.zohoapis.com/crm/v3";
const ZOHO_ACCOUNTS_URL = "https://accounts.zoho.com/oauth/v2/token";

// Token cache (in production, store in database)
let accessToken: string | null = null;
let tokenExpiry: number = 0;

interface ZohoRequest {
  action: "sync_customer" | "sync_order" | "sync_lead" | "get_leads" | "get_contacts" | "refresh_token";
  data?: any;
  refreshToken?: string;
}

async function getAccessToken(refreshToken: string): Promise<string> {
  // Check if cached token is still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const response = await fetch(ZOHO_ACCOUNTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: ZOHO_CLIENT_ID!,
      client_secret: ZOHO_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Zoho token refresh failed:", error);
    throw new Error("Failed to refresh Zoho access token");
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Expire 1 min early

  return accessToken!;
}

async function zohoRequest(
  endpoint: string,
  method: string,
  token: string,
  body?: any
): Promise<any> {
  const response = await fetch(`${ZOHO_API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Zoho API error (${endpoint}):`, error);
    throw new Error(`Zoho API request failed: ${response.status}`);
  }

  return response.json();
}

async function syncCustomerToZoho(customer: any, token: string): Promise<any> {
  // Create or update Contact in Zoho CRM
  const contactData = {
    data: [
      {
        Email: customer.email,
        First_Name: customer.first_name || customer.email.split("@")[0],
        Last_Name: customer.last_name || "Customer",
        Phone: customer.phone || "",
        Mailing_Street: customer.default_shipping_address?.address || "",
        Mailing_City: customer.default_shipping_address?.city || "",
        Mailing_State: customer.default_shipping_address?.province || "",
        Mailing_Zip: customer.default_shipping_address?.postalCode || "",
        Mailing_Country: customer.default_shipping_address?.country || "South Africa",
        Description: `Customer synced from African Vibe Store - ID: ${customer.id}`,
      },
    ],
    trigger: ["workflow"],
  };

  // Try to find existing contact by email first
  try {
    const searchResult = await zohoRequest(
      `/Contacts/search?email=${encodeURIComponent(customer.email)}`,
      "GET",
      token
    );

    if (searchResult.data && searchResult.data.length > 0) {
      // Update existing contact
      const contactId = searchResult.data[0].id;
      return await zohoRequest(`/Contacts/${contactId}`, "PUT", token, contactData);
    }
  } catch (e) {
    // No existing contact found, will create new
  }

  // Create new contact
  return await zohoRequest("/Contacts", "POST", token, contactData);
}

async function syncOrderToZoho(order: any, token: string): Promise<any> {
  // First, ensure customer exists as a Contact
  let contactId: string | null = null;
  
  if (order.guest_email) {
    try {
      const searchResult = await zohoRequest(
        `/Contacts/search?email=${encodeURIComponent(order.guest_email)}`,
        "GET",
        token
      );
      if (searchResult.data && searchResult.data.length > 0) {
        contactId = searchResult.data[0].id;
      }
    } catch (e) {
      // Contact not found
    }
  }

  // Create Deal (Sales Order) in Zoho CRM
  const dealData = {
    data: [
      {
        Deal_Name: `Order ${order.order_number}`,
        Amount: order.total_zar,
        Stage: mapOrderStatusToStage(order.status),
        Closing_Date: new Date().toISOString().split("T")[0],
        Contact_Name: contactId ? { id: contactId } : null,
        Description: `
Order Number: ${order.order_number}
Status: ${order.status}
Payment Status: ${order.payment_status}
Shipping Method: ${order.shipping_method || "N/A"}
Subtotal: R${order.subtotal_zar}
Shipping: R${order.shipping_cost_zar || 0}
Total: R${order.total_zar}
        `.trim(),
        Type: "E-commerce Order",
      },
    ],
    trigger: ["workflow"],
  };

  // Search for existing deal by order number
  try {
    const searchResult = await zohoRequest(
      `/Deals/search?criteria=(Deal_Name:equals:Order ${order.order_number})`,
      "GET",
      token
    );

    if (searchResult.data && searchResult.data.length > 0) {
      const dealId = searchResult.data[0].id;
      return await zohoRequest(`/Deals/${dealId}`, "PUT", token, dealData);
    }
  } catch (e) {
    // No existing deal found
  }

  return await zohoRequest("/Deals", "POST", token, dealData);
}

async function syncLeadToZoho(leadData: any, token: string): Promise<any> {
  const lead = {
    data: [
      {
        Email: leadData.email,
        First_Name: leadData.firstName || leadData.email.split("@")[0],
        Last_Name: leadData.lastName || "Lead",
        Phone: leadData.phone || "",
        Company: leadData.company || "Individual",
        Lead_Source: leadData.source || "Website",
        Lead_Status: "Not Contacted",
        Description: leadData.message || `Lead from African Vibe Store`,
        Street: leadData.address || "",
        City: leadData.city || "",
        State: leadData.province || "",
        Zip_Code: leadData.postalCode || "",
        Country: leadData.country || "South Africa",
      },
    ],
    trigger: ["workflow"],
  };

  return await zohoRequest("/Leads", "POST", token, lead);
}

function mapOrderStatusToStage(status: string): string {
  const stageMap: Record<string, string> = {
    pending: "Qualification",
    processing: "Needs Analysis",
    paid: "Value Proposition",
    shipped: "Decision Makers",
    delivered: "Closed Won",
    cancelled: "Closed Lost",
    refunded: "Closed Lost",
  };
  return stageMap[status] || "Qualification";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET) {
      throw new Error("Zoho CRM credentials not configured");
    }

    const { action, data, refreshToken }: ZohoRequest = await req.json();

    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    const token = await getAccessToken(refreshToken);

    let result: any;

    switch (action) {
      case "sync_customer":
        result = await syncCustomerToZoho(data, token);
        break;

      case "sync_order":
        result = await syncOrderToZoho(data, token);
        break;

      case "sync_lead":
        result = await syncLeadToZoho(data, token);
        break;

      case "get_leads":
        result = await zohoRequest("/Leads", "GET", token);
        break;

      case "get_contacts":
        result = await zohoRequest("/Contacts", "GET", token);
        break;

      case "refresh_token":
        result = { success: true, message: "Token refreshed successfully" };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Zoho CRM error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
