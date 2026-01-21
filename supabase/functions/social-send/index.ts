import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendRequest {
  platform: "whatsapp" | "facebook" | "instagram";
  to: string; // Phone number for WhatsApp, page-scoped ID for FB/IG
  message: string;
  pageId?: string; // Required for FB/IG
  messageType?: "text" | "template" | "catalogue";
  templateName?: string;
  catalogueId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { platform, to, message, pageId, messageType = "text", templateName, catalogueId }: SendRequest = await req.json();

    // Get access token from vault based on platform
    let accessToken: string | null = null;
    let phoneNumberId: string | null = null;

    if (platform === "whatsapp") {
      // Get WhatsApp access token
      const { data: tokenData } = await supabase
        .from("api_keys_vault")
        .select("key_value")
        .eq("service_type", "whatsapp")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!tokenData) {
        throw new Error("WhatsApp access token not found in vault");
      }
      accessToken = tokenData.key_value;

      // Get phone number ID
      const { data: phoneData } = await supabase
        .from("api_keys_vault")
        .select("key_value, description")
        .eq("service_type", "whatsapp")
        .eq("key_name", "WHATSAPP_PHONE_ID")
        .eq("is_active", true)
        .limit(1)
        .single();

      phoneNumberId = phoneData?.key_value || "581011471770928"; // Default to main number
    } else if (platform === "facebook" || platform === "instagram") {
      // Get page access token from vault
      const { data: tokenData } = await supabase
        .from("api_keys_vault")
        .select("key_value")
        .eq("service_type", platform === "facebook" ? "facebook" : "instagram")
        .ilike("description", `%${pageId}%`)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!tokenData) {
        throw new Error(`${platform} page access token not found for page ${pageId}`);
      }
      accessToken = tokenData.key_value;
    }

    if (!accessToken) {
      throw new Error(`No access token found for ${platform}`);
    }

    let response;
    let messageData: any = {};

    if (platform === "whatsapp") {
      // Send WhatsApp message via Cloud API
      const waEndpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

      let messagePayload: any = {
        messaging_product: "whatsapp",
        to: to,
      };

      if (messageType === "template" && templateName) {
        messagePayload.type = "template";
        messagePayload.template = {
          name: templateName,
          language: { code: "en" },
        };
      } else if (messageType === "catalogue" && catalogueId) {
        // Send catalogue message
        messagePayload.type = "interactive";
        messagePayload.interactive = {
          type: "catalog_message",
          body: { text: message },
          action: {
            name: "catalog_message",
            parameters: {
              thumbnail_product_retailer_id: catalogueId,
            },
          },
        };
      } else {
        messagePayload.type = "text";
        messagePayload.text = { body: message };
      }

      response = await fetch(waEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("WhatsApp API error:", result);
        throw new Error(result.error?.message || "Failed to send WhatsApp message");
      }

      // Store outbound message in database
      messageData = {
        wa_message_id: result.messages?.[0]?.id,
        from_number: phoneNumberId,
        to_number: to,
        message_type: messageType,
        message_content: message,
        direction: "outbound",
        status: "sent",
        timestamp: new Date().toISOString(),
      };

      await supabase.from("whatsapp_messages").insert(messageData);

      return new Response(JSON.stringify({ success: true, messageId: result.messages?.[0]?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (platform === "facebook") {
      // Send Facebook Messenger message
      const fbEndpoint = `https://graph.facebook.com/v21.0/me/messages`;

      response = await fetch(fbEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: accessToken,
          recipient: { id: to },
          message: { text: message },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Facebook API error:", result);
        throw new Error(result.error?.message || "Failed to send Facebook message");
      }

      return new Response(JSON.stringify({ success: true, messageId: result.message_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (platform === "instagram") {
      // Send Instagram Direct message
      const igEndpoint = `https://graph.facebook.com/v21.0/me/messages`;

      response = await fetch(igEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: accessToken,
          recipient: { id: to },
          message: { text: message },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Instagram API error:", result);
        throw new Error(result.error?.message || "Failed to send Instagram message");
      }

      return new Response(JSON.stringify({ success: true, messageId: result.message_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid platform" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Social send error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to send message" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
