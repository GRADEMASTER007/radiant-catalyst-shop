import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
const APP_SECRET = Deno.env.get('WHATSAPP_APP_SECRET');

// Verify Meta's X-Hub-Signature-256 HMAC-SHA256 over the raw body.
async function verifyMetaSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  if (!APP_SECRET) {
    console.error('WHATSAPP_APP_SECRET not configured - rejecting webhook');
    return false;
  }
  if (!signatureHeader?.startsWith('sha256=')) return false;
  const provided = signatureHeader.slice('sha256='.length);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(APP_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  if (expected.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  return diff === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    // GET = Meta webhook verification
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified successfully!');
        return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
      }
      return new Response('Forbidden', { status: 403 });
    }

    // POST = Incoming webhook event
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Incoming webhook:', JSON.stringify(body, null, 2));

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            const value = change.value;

            // Handle incoming messages
            if (value.messages) {
              for (const message of value.messages) {
                const messageContent = getMessageContent(message);

                const messageData = {
                  wa_message_id: message.id,
                  from_number: message.from,
                  to_number: value.metadata?.display_phone_number,
                  message_type: message.type,
                  message_content: messageContent,
                  timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                  direction: 'inbound',
                  status: 'received',
                  raw_payload: message,
                };

                const { error } = await supabase.from('whatsapp_messages').insert(messageData);
                if (error) console.error('Error storing message:', error);

                // Upsert contact
                const contacts = value.contacts || [];
                const contact = contacts.find((c: any) => c.wa_id === message.from);
                if (contact) {
                  await supabase.from('whatsapp_contacts').upsert({
                    wa_id: contact.wa_id,
                    name: contact.profile?.name,
                    phone_number: message.from,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'wa_id' });
                }

                // === AI AUTO-REPLY (only for text messages) ===
                if (message.type === 'text' && messageContent) {
                  try {
                    await generateAndSendAIReply(
                      supabase,
                      supabaseUrl,
                      supabaseKey,
                      message.from,
                      messageContent,
                      value.metadata?.phone_number_id
                    );
                  } catch (aiErr) {
                    console.error('AI auto-reply failed:', aiErr);
                  }
                }
              }
            }

            // Handle status updates
            if (value.statuses) {
              for (const status of value.statuses) {
                await supabase.from('whatsapp_messages').update({
                  status: status.status,
                  status_timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString(),
                }).eq('wa_message_id', status.id);
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal error', received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Generate AI reply and send via WhatsApp
async function generateAndSendAIReply(
  supabase: any,
  supabaseUrl: string,
  supabaseKey: string,
  senderNumber: string,
  userMessage: string,
  phoneNumberId: string | undefined
) {
  // 1. Fetch knowledge base for context
  const { data: kbArticles } = await supabase
    .from('knowledge_base')
    .select('title, content, category')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(10);

  let knowledgeContext = '';
  if (kbArticles?.length) {
    knowledgeContext = '\n\nKNOWLEDGE BASE:\n' +
      kbArticles.map((a: any) => `[${a.category}] ${a.title}: ${a.content}`).join('\n\n');
  }

  // 2. Fetch recent conversation history for this number
  const { data: recentMessages } = await supabase
    .from('whatsapp_messages')
    .select('direction, message_content, timestamp')
    .or(`from_number.eq.${senderNumber},to_number.eq.${senderNumber}`)
    .order('timestamp', { ascending: false })
    .limit(10);

  const conversationHistory: Array<{ role: string; content: string }> = [];
  if (recentMessages?.length) {
    // Reverse to get chronological order (skip the current message, it's first)
    for (const msg of [...recentMessages].reverse()) {
      if (msg.message_content) {
        conversationHistory.push({
          role: msg.direction === 'inbound' ? 'user' : 'assistant',
          content: msg.message_content,
        });
      }
    }
  }

  // 3. Call AI orchestrator
  const systemPrompt = `You are the WhatsApp AI assistant for African Vibe / ProAgrisa. You help customers with product inquiries, orders, farming advice, and general questions. Be friendly, concise, and helpful. Keep responses under 300 words as this is WhatsApp. Contact: +27 83 447 4639 | Email: admin@proagrisa.co.za | Website: africanvibe.co.za${knowledgeContext}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
  ];

  // Ensure the current user message is at the end
  if (!conversationHistory.length || conversationHistory[conversationHistory.length - 1]?.content !== userMessage) {
    messages.push({ role: 'user', content: userMessage });
  }

  const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-orchestrator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      type: 'customer_chat',
      messages,
      stream: false,
    }),
  });

  const aiData = await aiResponse.json();
  const replyText = aiData.content || aiData.error || "Sorry, I couldn't process your request right now. Please try again later.";

  // 4. Get WhatsApp access token from vault
  const { data: tokenData } = await supabase
    .from('api_keys_vault')
    .select('key_value')
    .eq('service_type', 'whatsapp')
    .eq('key_name', 'WHATSAPP_ACCESS_TOKEN')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!tokenData) {
    console.error('WhatsApp access token not found in vault');
    return;
  }

  // Get phone number ID from vault or use the one from webhook
  let waPhoneNumberId = phoneNumberId;
  if (!waPhoneNumberId) {
    const { data: phoneData } = await supabase
      .from('api_keys_vault')
      .select('key_value')
      .eq('service_type', 'whatsapp')
      .eq('key_name', 'WHATSAPP_PHONE_ID')
      .eq('is_active', true)
      .limit(1)
      .single();
    waPhoneNumberId = phoneData?.key_value || '';
  }

  if (!waPhoneNumberId) {
    console.error('WhatsApp Phone Number ID not found');
    return;
  }

  // 5. Send reply via WhatsApp Cloud API
  const waResponse = await fetch(
    `https://graph.facebook.com/v21.0/${waPhoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.key_value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: senderNumber,
        type: 'text',
        text: { body: replyText },
      }),
    }
  );

  const waResult = await waResponse.json();
  console.log('WhatsApp reply sent:', waResult);

  // 6. Store outbound reply in database
  await supabase.from('whatsapp_messages').insert({
    wa_message_id: waResult.messages?.[0]?.id || null,
    from_number: waPhoneNumberId,
    to_number: senderNumber,
    message_type: 'text',
    message_content: replyText,
    direction: 'outbound',
    status: 'sent',
    timestamp: new Date().toISOString(),
  });
}

function getMessageContent(message: any): string {
  switch (message.type) {
    case 'text': return message.text?.body || '';
    case 'image': return `[Image: ${message.image?.caption || 'No caption'}]`;
    case 'video': return `[Video: ${message.video?.caption || 'No caption'}]`;
    case 'audio': return '[Audio message]';
    case 'document': return `[Document: ${message.document?.filename || 'Unknown'}]`;
    case 'location': return `[Location: ${message.location?.latitude}, ${message.location?.longitude}]`;
    case 'contacts': return '[Contact shared]';
    case 'sticker': return '[Sticker]';
    case 'interactive':
      return message.interactive?.button_reply?.title ||
             message.interactive?.list_reply?.title ||
             '[Interactive response]';
    default: return `[${message.type}]`;
  }
}
