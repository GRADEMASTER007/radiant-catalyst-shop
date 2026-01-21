import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "order_confirmation" | "shipping_notification" | "payment_receipt" | "general";
  orderId?: string;
  email: string;
  subject?: string;
  body?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);
}

function generateOrderConfirmationEmail(order: any, items: any[]): { subject: string; body: string } {
  const itemsList = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.product_name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.unit_price_zar)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.total_price_zar)}</td>
        </tr>`
    )
    .join("");

  const shippingAddress = order.shipping_address || {};

  // Parse rooting service info from order notes
  const hasRootingService = order.notes && order.notes.includes("Rooting Service:");
  const rootingDetails = hasRootingService ? order.notes : null;

  // Calculate rooting cost from notes (format: "Rooting Service: X plants @ RY/plant = RZ")
  let rootingCost = 0;
  let rootingPlants = 0;
  let rootingRate = 0;
  if (rootingDetails) {
    const match = rootingDetails.match(/(\d+) plants @ R([\d.]+)\/plant = R([\d.]+)/);
    if (match) {
      rootingPlants = parseInt(match[1]);
      rootingRate = parseFloat(match[2]);
      rootingCost = parseFloat(match[3]);
    }
  }

  const subject = `Order Confirmed - ${order.order_number} | Dragon Fruit South Africa`;

  const body = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #E91E8C 0%, #C2185B 50%, #4CAF50 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🐉 Dragon Fruit SA</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Thank you for your order!</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <div style="background: #FFF0F5; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #E91E8C;">
            <h2 style="margin: 0 0 10px; color: #E91E8C; font-size: 18px;">Order Confirmed ✓</h2>
            <p style="margin: 0; font-size: 14px; color: #666;">Order Number: <strong style="color: #333;">${order.order_number}</strong></p>
          </div>

          <h3 style="color: #333; border-bottom: 2px solid #E91E8C; padding-bottom: 10px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr style="background: #f9f9f9;">
                <th style="padding: 12px; text-align: left; font-weight: 600;">Item</th>
                <th style="padding: 12px; text-align: center; font-weight: 600;">Qty</th>
                <th style="padding: 12px; text-align: right; font-weight: 600;">Price</th>
                <th style="padding: 12px; text-align: right; font-weight: 600;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          ${hasRootingService ? `
          <!-- Rooting Service Section -->
          <div style="background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #4CAF50;">
            <h3 style="margin: 0 0 15px; color: #2E7D32; font-size: 16px; display: flex; align-items: center;">
              🌱 Professional Rooting Service Included
            </h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 5px 0; color: #555;">Plants to be rooted:</td>
                <td style="text-align: right; font-weight: bold; color: #2E7D32;">${rootingPlants} plants</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #555;">Rate per plant:</td>
                <td style="text-align: right; font-weight: bold;">${formatCurrency(rootingRate)}</td>
              </tr>
              <tr style="border-top: 1px dashed #4CAF50;">
                <td style="padding: 10px 0 5px; color: #555; font-weight: bold;">Rooting Service Total:</td>
                <td style="text-align: right; font-weight: bold; color: #2E7D32; font-size: 16px;">${formatCurrency(rootingCost)}</td>
              </tr>
            </table>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #4CAF50;">
              <p style="margin: 0; font-size: 13px; color: #555;">
                <strong>What to expect:</strong><br>
                • Your cuttings will be professionally rooted at our nursery<br>
                • 95%+ success rate guaranteed<br>
                • Ready-to-plant rooted plants in 6-10 weeks<br>
                • We'll notify you when your plants are ready
              </p>
            </div>
          </div>
          ` : ""}

          <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 5px 0;">Subtotal:</td>
                <td style="text-align: right;">${formatCurrency(order.subtotal_zar - rootingCost)}</td>
              </tr>
              ${hasRootingService ? `
              <tr>
                <td style="padding: 5px 0; color: #2E7D32;">
                  <span style="display: inline-flex; align-items: center; gap: 5px;">
                    🌱 Rooting Service:
                  </span>
                </td>
                <td style="text-align: right; color: #2E7D32;">${formatCurrency(rootingCost)}</td>
              </tr>
              ` : ""}
              <tr>
                <td style="padding: 5px 0;">Shipping:</td>
                <td style="text-align: right;">${formatCurrency(order.shipping_cost_zar || 0)}</td>
              </tr>
              ${order.discount_zar ? `<tr><td style="padding: 5px 0;">Discount:</td><td style="text-align: right; color: #27ae60;">-${formatCurrency(order.discount_zar)}</td></tr>` : ""}
              <tr style="font-size: 18px; font-weight: bold; color: #E91E8C;">
                <td style="padding: 10px 0; border-top: 2px solid #ddd;">Total:</td>
                <td style="text-align: right; padding: 10px 0; border-top: 2px solid #ddd;">${formatCurrency(order.total_zar)}</td>
              </tr>
            </table>
          </div>

          ${shippingAddress.address ? `
          <h3 style="color: #333; border-bottom: 2px solid #E91E8C; padding-bottom: 10px;">Shipping Address</h3>
          <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <p style="margin: 0; line-height: 1.8;">
              ${shippingAddress.name || ""}<br>
              ${shippingAddress.address || ""}<br>
              ${shippingAddress.city || ""}, ${shippingAddress.province || ""}<br>
              ${shippingAddress.postalCode || ""}<br>
              ${shippingAddress.phone || ""}
            </p>
          </div>
          ` : ""}

          ${hasRootingService ? `
          <div style="background: #FFF8E1; border-radius: 8px; padding: 15px; margin-bottom: 25px; border: 1px dashed #FFC107;">
            <p style="margin: 0; font-size: 13px; color: #F57C00;">
              <strong>📋 Rooting Service Note:</strong> ${hasRootingService ? "Unrooted cuttings will be shipped separately after rooting is complete." : "Your cuttings will be shipped as unrooted cuttings."}
            </p>
          </div>
          ` : ""}

          <div style="text-align: center; padding: 20px; background: #FFF0F5; border-radius: 8px;">
            <p style="margin: 0 0 10px; color: #666;">Questions about your order?</p>
            <a href="mailto:orders@proagrisa.co.za" style="color: #E91E8C; text-decoration: none; font-weight: bold;">orders@proagrisa.co.za</a>
            <p style="margin: 10px 0 0; font-size: 13px; color: #999;">WhatsApp: +27 83 447 4639</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #1a1a2e; color: white; padding: 25px; text-align: center;">
          <p style="margin: 0 0 10px; font-size: 14px;">Dragon Fruit Farming Africa (DFSA)</p>
          <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.7);">South Africa | +27 83 447 4639</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, body };
}

function generateShippingNotificationEmail(order: any, trackingNumber: string, trackingUrl?: string): { subject: string; body: string } {
  const subject = `Your order is on its way! - ${order.order_number}`;
  
  const body = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #D35400 0%, #B8860B 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📦 Your order has shipped!</h1>
        </div>
        <div style="padding: 30px;">
          <p>Great news! Your order <strong>${order.order_number}</strong> is on its way to you.</p>
          
          <div style="background: #FFF8E7; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px; color: #666;">Tracking Number:</p>
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #D35400;">${trackingNumber}</p>
            ${trackingUrl ? `<a href="${trackingUrl}" style="display: inline-block; margin-top: 15px; padding: 12px 25px; background: #D35400; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Track Your Order</a>` : ""}
          </div>
          
          <p style="color: #666; font-size: 14px;">You'll receive another email when your order is delivered.</p>
        </div>
        <div style="background: #2C1810; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 12px;">African Vibe | orders@proagrisa.co.za</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, body };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpHost || !smtpUser || !smtpPassword) {
      throw new Error("SMTP credentials not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, orderId, email, subject, body, trackingNumber, trackingUrl }: EmailRequest = await req.json();

    let emailSubject = subject || "";
    let emailBody = body || "";

    // Generate email content based on type
    if (type === "order_confirmation" && orderId) {
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (order) {
        const emailContent = generateOrderConfirmationEmail(order, items || []);
        emailSubject = emailContent.subject;
        emailBody = emailContent.body;
      }
    } else if (type === "shipping_notification" && orderId && trackingNumber) {
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (order) {
        const emailContent = generateShippingNotificationEmail(order, trackingNumber, trackingUrl);
        emailSubject = emailContent.subject;
        emailBody = emailContent.body;
      }
    }

    // Send email using SMTP
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    await client.send({
      from: smtpUser,
      to: email,
      bcc: "orders@proagrisa.co.za", // Always BCC admin
      subject: emailSubject,
      content: "Please view this email in an HTML-compatible email client.",
      html: emailBody,
    });

    await client.close();

    console.log(`Email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Email sending error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
