-- Add SerpAPI tool configuration columns to ai_model_config
ALTER TABLE public.ai_model_config 
ADD COLUMN IF NOT EXISTS tools_enabled_serpapi boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS serpapi_max_calls integer DEFAULT 10;

-- Add missing providers to ai_provider_config
INSERT INTO public.ai_provider_config (provider_name, display_name, base_url, auth_type, auth_header, is_active, priority) VALUES
  ('anthropic', 'Anthropic Claude', 'https://api.anthropic.com/v1/messages', 'api-key', 'x-api-key', false, 8),
  ('mistral', 'Mistral AI', 'https://api.mistral.ai/v1/chat/completions', 'bearer', 'Authorization', false, 9),
  ('perplexity', 'Perplexity AI', 'https://api.perplexity.ai/chat/completions', 'bearer', 'Authorization', false, 10),
  ('fireworks', 'Fireworks AI', 'https://api.fireworks.ai/inference/v1/chat/completions', 'bearer', 'Authorization', false, 11),
  ('azure_openai', 'Azure OpenAI', 'https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions', 'api-key', 'api-key', false, 12),
  ('bedrock', 'AWS Bedrock', 'https://bedrock-runtime.{region}.amazonaws.com', 'aws-sig', 'Authorization', false, 13),
  ('vertex', 'Google Vertex AI', 'https://{region}-aiplatform.googleapis.com/v1/projects/{project}/locations/{region}/publishers/google/models', 'bearer', 'Authorization', false, 14)
ON CONFLICT (provider_name) DO NOTHING;

-- Add provider secret key mapping to settings jsonb
UPDATE public.ai_provider_config SET settings = jsonb_set(COALESCE(settings, '{}'), '{secretKey}', '"ANTHROPIC_API_KEY"') WHERE provider_name = 'anthropic';
UPDATE public.ai_provider_config SET settings = jsonb_set(COALESCE(settings, '{}'), '{secretKey}', '"MISTRAL_API_KEY"') WHERE provider_name = 'mistral';
UPDATE public.ai_provider_config SET settings = jsonb_set(COALESCE(settings, '{}'), '{secretKey}', '"PERPLEXITY_API_KEY"') WHERE provider_name = 'perplexity';
UPDATE public.ai_provider_config SET settings = jsonb_set(COALESCE(settings, '{}'), '{secretKey}', '"FIREWORKS_API_KEY"') WHERE provider_name = 'fireworks';
UPDATE public.ai_provider_config SET settings = jsonb_set(COALESCE(settings, '{}'), '{secretKey}', '"AZURE_OPENAI_API_KEY"') WHERE provider_name = 'azure_openai';
UPDATE public.ai_provider_config SET settings = jsonb_set(COALESCE(settings, '{}'), '{secretKey}', '"AWS_ACCESS_KEY_ID"') WHERE provider_name = 'bedrock';
UPDATE public.ai_provider_config SET settings = jsonb_set(COALESCE(settings, '{}'), '{secretKey}', '"GOOGLE_VERTEX_API_KEY"') WHERE provider_name = 'vertex';

-- Add secret key to existing providers
UPDATE public.ai_provider_config SET settings = jsonb_set(COALESCE(settings, '{}'), '{secretKey}', '"ONEMIN_AI_API_KEY"') WHERE provider_name = '1min.ai';
UPDATE public.ai_provider_config SET settings = jsonb_set(COALESCE(settings, '{}'), '{secretKey}', '"OPENROUTER_API_KEY"') WHERE provider_name = 'openrouter';
UPDATE public.ai_provider_config SET settings = jsonb_set(COALESCE(settings, '{}'), '{secretKey}', '"DEEPINFRA_API_KEY"') WHERE provider_name = 'deepinfra';
UPDATE public.ai_provider_config SET settings = jsonb_set(COALESCE(settings, '{}'), '{secretKey}', '"TOGETHER_API_KEY"') WHERE provider_name = 'together';
UPDATE public.ai_provider_config SET settings = jsonb_set(COALESCE(settings, '{}'), '{secretKey}', '"GOOGLE_AI_API_KEY"') WHERE provider_name = 'google';
UPDATE public.ai_provider_config SET settings = jsonb_set(COALESCE(settings, '{}'), '{secretKey}', '"GROQ_API_KEY"') WHERE provider_name = 'groq';
UPDATE public.ai_provider_config SET settings = jsonb_set(COALESCE(settings, '{}'), '{secretKey}', '"HUGGINGFACE_TOKEN"') WHERE provider_name = 'huggingface';