-- Create WhatsApp messages table
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_message_id TEXT UNIQUE,
  from_number TEXT NOT NULL,
  to_number TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  message_content TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'pending',
  status_timestamp TIMESTAMPTZ,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create WhatsApp contacts table
CREATE TABLE public.whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_id TEXT UNIQUE NOT NULL,
  name TEXT,
  phone_number TEXT,
  email TEXT,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create API keys vault table
CREATE TABLE public.api_keys_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL UNIQUE,
  key_value TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys_vault ENABLE ROW LEVEL SECURITY;

-- WhatsApp messages policies (admin only)
CREATE POLICY "Admins can view all messages" 
ON public.whatsapp_messages 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access messages" 
ON public.whatsapp_messages 
FOR ALL 
USING (auth.role() = 'service_role');

-- WhatsApp contacts policies (admin only)
CREATE POLICY "Admins can manage contacts" 
ON public.whatsapp_contacts 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access contacts" 
ON public.whatsapp_contacts 
FOR ALL 
USING (auth.role() = 'service_role');

-- API keys vault policies (admin only - sensitive data)
CREATE POLICY "Admins can view api keys" 
ON public.api_keys_vault 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage api keys" 
ON public.api_keys_vault 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_whatsapp_messages_from ON public.whatsapp_messages(from_number);
CREATE INDEX idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp DESC);
CREATE INDEX idx_whatsapp_contacts_wa_id ON public.whatsapp_contacts(wa_id);
CREATE INDEX idx_api_keys_service ON public.api_keys_vault(service_type);