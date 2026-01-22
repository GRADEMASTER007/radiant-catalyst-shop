-- Create AI provider configuration table
CREATE TABLE IF NOT EXISTS public.ai_provider_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  base_url text NOT NULL,
  auth_type text NOT NULL DEFAULT 'bearer', -- 'bearer', 'api-key', 'custom'
  auth_header text DEFAULT 'Authorization',
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 10,
  rate_limit_per_minute integer DEFAULT 60,
  daily_credit_limit integer DEFAULT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create AI usage tracking table
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name text NOT NULL,
  model_id text NOT NULL,
  function_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  cost_estimate numeric(10, 6) DEFAULT 0,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  response_time_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for usage analytics
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_provider ON public.ai_usage_log(provider_name);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created ON public.ai_usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user ON public.ai_usage_log(user_id);

-- Enable RLS
ALTER TABLE public.ai_provider_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- RLS for provider config (admin only)
CREATE POLICY "Admins can manage AI providers"
  ON public.ai_provider_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access AI providers"
  ON public.ai_provider_config FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS for usage log
CREATE POLICY "Admins can view usage logs"
  ON public.ai_usage_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access usage log"
  ON public.ai_usage_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Insert default provider configurations
INSERT INTO public.ai_provider_config (provider_name, display_name, base_url, auth_type, auth_header, priority, is_active) VALUES
  ('1min.ai', '1min.AI (Primary)', 'https://api.1min.ai/api', 'api-key', 'API-KEY', 1, true),
  ('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1/chat/completions', 'bearer', 'Authorization', 2, true),
  ('deepinfra', 'DeepInfra', 'https://api.deepinfra.com/v1/openai/chat/completions', 'bearer', 'Authorization', 3, false),
  ('together', 'Together AI', 'https://api.together.xyz/v1/chat/completions', 'bearer', 'Authorization', 4, false),
  ('google', 'Google AI Studio', 'https://generativelanguage.googleapis.com/v1beta', 'bearer', 'Authorization', 5, false),
  ('groq', 'Groq', 'https://api.groq.com/openai/v1/chat/completions', 'bearer', 'Authorization', 6, false),
  ('huggingface', 'Hugging Face', 'https://api-inference.huggingface.co/models/', 'bearer', 'Authorization', 7, false)
ON CONFLICT (provider_name) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_ai_provider_config_updated_at
  BEFORE UPDATE ON public.ai_provider_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();