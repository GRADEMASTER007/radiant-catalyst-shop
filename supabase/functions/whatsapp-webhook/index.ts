import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify token for Meta webhook verification
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'DFSA_WHATSAPP_VERIFY_2024';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    // GET request = Meta webhook verification challenge
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log('Webhook verification request:', { mode, token, challenge });

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified successfully!');
        return new Response(challenge, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      } else {
        console.error('Webhook verification failed - token mismatch');
        return new Response('Forbidden', { status: 403 });
      }
    }

    // POST request = Incoming webhook event
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Incoming webhook:', JSON.stringify(body, null, 2));

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Process WhatsApp messages
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            const value = change.value;
            
            // Handle incoming messages
            if (value.messages) {
              for (const message of value.messages) {
                const messageData = {
                  wa_message_id: message.id,
                  from_number: message.from,
                  to_number: value.metadata?.display_phone_number,
                  message_type: message.type,
                  message_content: getMessageContent(message),
                  timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                  direction: 'inbound',
                  status: 'received',
                  raw_payload: message,
                };

                console.log('Storing message:', messageData);

                // Store message in database
                const { error } = await supabase
                  .from('whatsapp_messages')
                  .insert(messageData);

                if (error) {
                  console.error('Error storing message:', error);
                }

                // Get contact info if available
                const contacts = value.contacts || [];
                const contact = contacts.find((c: any) => c.wa_id === message.from);
                
                if (contact) {
                  // Upsert contact
                  await supabase
                    .from('whatsapp_contacts')
                    .upsert({
                      wa_id: contact.wa_id,
                      name: contact.profile?.name,
                      phone_number: message.from,
                      updated_at: new Date().toISOString(),
                    }, { onConflict: 'wa_id' });
                }
              }
            }

            // Handle message status updates
            if (value.statuses) {
              for (const status of value.statuses) {
                console.log('Status update:', status);
                
                await supabase
                  .from('whatsapp_messages')
                  .update({ 
                    status: status.status,
                    status_timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString(),
                  })
                  .eq('wa_message_id', status.id);
              }
            }
          }
        }
      }

      // Always respond with 200 to acknowledge receipt
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent Meta from retrying
    return new Response(JSON.stringify({ error: 'Internal error', received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper to extract message content based on type
function getMessageContent(message: any): string {
  switch (message.type) {
    case 'text':
      return message.text?.body || '';
    case 'image':
      return `[Image: ${message.image?.caption || 'No caption'}]`;
    case 'video':
      return `[Video: ${message.video?.caption || 'No caption'}]`;
    case 'audio':
      return '[Audio message]';
    case 'document':
      return `[Document: ${message.document?.filename || 'Unknown'}]`;
    case 'location':
      return `[Location: ${message.location?.latitude}, ${message.location?.longitude}]`;
    case 'contacts':
      return `[Contact shared]`;
    case 'sticker':
      return '[Sticker]';
    case 'interactive':
      return message.interactive?.button_reply?.title || 
             message.interactive?.list_reply?.title || 
             '[Interactive response]';
    default:
      return `[${message.type}]`;
  }
}
