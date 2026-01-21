import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAdminAuth, corsHeaders, forbiddenResponse, unauthorizedResponse } from "../_shared/auth.ts";

const ZOHO_CLIENT_ID = Deno.env.get("ZOHO_CLIENT_ID");
const ZOHO_CLIENT_SECRET = Deno.env.get("ZOHO_CLIENT_SECRET");
const ZOHO_API_BASE = "https://www.zohoapis.com/crm/v3";
const ZOHO_ACCOUNTS_URL = "https://accounts.zoho.com/oauth/v2/token";

// Token cache (short-lived access tokens)
let accessToken: string | null = null;
let tokenExpiry: number = 0;

interface ZohoRequest {
  action: "sync_customer" | "sync_order" | "sync_lead" | "get_leads" | "get_contacts" | "refresh_token";
  data?: unknown;
}

// deno-lint-ignore no-explicit-any
async function getRefreshTokenFromDB(supabase: any, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("integration_tokens")
    .select("encrypted_token")
    .eq("user_id", userId)
    .eq("provider", "zoho")
    .single();

  if (error || !data) {
    return null;
  }

  return (data as { encrypted_token: string }).encrypted_token;
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
  body?: unknown
): Promise<unknown> {
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

// deno-lint-ignore no-explicit-any
async function syncCustomerToZoho(customer: any, token: string): Promise<unknown> {
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
        Description: `Customer synced from DFSA Store - ID: ${customer.id}`,
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
    ) as { data?: Array<{ id: string }> };

    if (searchResult.data && searchResult.data.length > 0) {
      // Update existing contact
      const contactId = searchResult.data[0].id;
      return await zohoRequest(`/Contacts/${contactId}`, "PUT", token, contactData);
    }
  } catch {
    // No existing contact found, will create new
  }

  // Create new contact
  return await zohoRequest("/Contacts", "POST", token, contactData);
}

// deno-lint-ignore no-explicit-any
async function syncOrderToZoho(order: any, token: string): Promise<unknown> {
  // First, ensure customer exists as a Contact
  let contactId: string | null = null;
  
  if (order.guest_email) {
    try {
      const searchResult = await zohoRequest(
        `/Contacts/search?email=${encodeURIComponent(order.guest_email)}`,
        "GET",
        token
      ) as { data?: Array<{ id: string }> };
      if (searchResult.data && searchResult.data.length > 0) {
        contactId = searchResult.data[0].id;
      }
    } catch {
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
    ) as { data?: Array<{ id: string }> };

    if (searchResult.data && searchResult.data.length > 0) {
      const dealId = searchResult.data[0].id;
      return await zohoRequest(`/Deals/${dealId}`, "PUT", token, dealData);
    }
  } catch {
    // No existing deal found
  }

  return await zohoRequest("/Deals", "POST", token, dealData);
}

// deno-lint-ignore no-explicit-any
async function syncLeadToZoho(leadData: any, token: string): Promise<unknown> {
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
        Description: leadData.message || `Lead from DFSA Store`,
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
    // Validate admin authentication
    const auth = await validateAdminAuth(req);
    if (auth.error) {
      if (auth.error === "Admin access required") {
        return forbiddenResponse(auth.error);
      }
      return unauthorizedResponse(auth.error);
    }

    if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET) {
      throw new Error("Zoho CRM credentials not configured");
    }

    // Get refresh token from secure database storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const refreshToken = await getRefreshTokenFromDB(supabase, auth.user!.id);
    
    if (!refreshToken) {
      throw new Error("Zoho not connected. Please configure your refresh token in Settings.");
    }

    const { action, data }: ZohoRequest = await req.json();
    const token = await getAccessToken(refreshToken);

    let result: unknown;

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
  } catch (error: unknown) {
    console.error("Zoho CRM error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
