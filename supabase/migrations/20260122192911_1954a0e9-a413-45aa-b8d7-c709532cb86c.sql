-- Disable the broken 1min.ai provider that returns 401 "API Key is not active"
UPDATE ai_provider_config
SET is_active = false, updated_at = now()
WHERE provider_name = '1min.ai';

-- Verify OpenRouter is priority 1 and active
UPDATE ai_provider_config
SET is_active = true, priority = 1, updated_at = now()
WHERE provider_name = 'openrouter';

-- Ensure customer_chat scope is configured to use openrouter
UPDATE ai_model_config
SET provider = 'openrouter', updated_at = now()
WHERE function_type = 'customer_chat' AND provider != 'openrouter';