-- Create secure table for storing integration tokens (encrypted at rest by Supabase)
CREATE TABLE public.integration_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL,
  encrypted_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- Enable RLS
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;

-- Only admins can access integration tokens (via service role in edge functions)
CREATE POLICY "Only service role can access tokens"
ON public.integration_tokens
FOR ALL
USING (false)
WITH CHECK (false);

-- Add timestamp trigger
CREATE TRIGGER update_integration_tokens_updated_at
BEFORE UPDATE ON public.integration_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();