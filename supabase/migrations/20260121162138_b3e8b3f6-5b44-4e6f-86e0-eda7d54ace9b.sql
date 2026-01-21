-- Create table to store AI model preferences
CREATE TABLE public.ai_model_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_type TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'openrouter',
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_model_config ENABLE ROW LEVEL SECURITY;

-- Admin can manage AI config
CREATE POLICY "Admins can manage AI config" ON public.ai_model_config
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role full access
CREATE POLICY "Service role full access AI config" ON public.ai_model_config
  FOR ALL USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Insert default configurations
INSERT INTO public.ai_model_config (function_type, provider, model_id, model_name, description) VALUES
  ('chat', 'openrouter', 'qwen/qwen3-next-80b-a3b-instruct:free', 'Qwen3 Next 80B', 'Customer chat and general assistance'),
  ('coding', 'kilocode', 'qwen/qwen3-coder:free', 'Qwen3 Coder', 'Code generation and review'),
  ('reasoning', 'kilocode', 'deepseek/deepseek-r1-0528:free', 'DeepSeek R1', 'Complex reasoning tasks'),
  ('agent', 'kilocode', 'moonshotai/kimi-k2:free', 'Kimi K2', 'Agentic tool use and synthesis'),
  ('fast', 'kilocode', 'zhipu-ai/glm-4.5-air:free', 'GLM 4.5 Air', 'Quick lightweight tasks'),
  ('audit', 'openrouter', 'mistralai/devstral-2-2512:free', 'Mistral Devstral 2', 'Security audits (256K context)'),
  ('seo', 'openrouter', 'xiaomi/mimo-v2-flash:free', 'Xiaomi MiMo V2', 'SEO optimization'),
  ('content', 'openrouter', 'nvidia/nemotron-3-nano-30b-a3b:free', 'NVIDIA Nemotron 3', 'Content generation'),
  ('vision', 'openrouter', 'nvidia/nemotron-nano-12b-2-vl:free', 'NVIDIA Nemotron VL', 'Image/document analysis');

-- Trigger for updated_at
CREATE TRIGGER update_ai_model_config_updated_at
  BEFORE UPDATE ON public.ai_model_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();