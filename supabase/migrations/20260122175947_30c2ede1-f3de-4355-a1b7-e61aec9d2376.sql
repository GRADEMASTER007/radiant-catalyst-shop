-- Fix OpenRouter base URL to include the full chat completions path
UPDATE public.ai_provider_config
SET base_url = 'https://openrouter.ai/api/v1/chat/completions',
    updated_at = now()
WHERE provider_name = 'openrouter';