-- =============================================
-- PROVIDER REGISTRY: Add Google Gemini & 1min.ai as first-class providers
-- =============================================

-- 1. Add Google AI Studio (Gemini) provider
INSERT INTO public.ai_provider_config (
    provider_name,
    display_name,
    base_url,
    auth_type,
    auth_header,
    settings,
    is_active,
    priority
) VALUES (
    'google_ai_studio',
    'Google AI Studio (Gemini)',
    'https://generativelanguage.googleapis.com/v1',
    'api-key',
    'x-goog-api-key',
    '{"secretKey": "GOOGLE_AI_API_KEY", "apiFormat": "gemini_native", "modelsEndpoint": "/models"}'::jsonb,
    TRUE,
    5
)
ON CONFLICT (provider_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    base_url = EXCLUDED.base_url,
    auth_type = EXCLUDED.auth_type,
    auth_header = EXCLUDED.auth_header,
    settings = EXCLUDED.settings,
    is_active = EXCLUDED.is_active;

-- 2. Add 1min.ai provider (fully configured)
INSERT INTO public.ai_provider_config (
    provider_name,
    display_name,
    base_url,
    auth_type,
    auth_header,
    settings,
    is_active,
    priority
) VALUES (
    'onemin',
    '1min.ai',
    'https://api.1min.ai',
    'api-key',
    'API-KEY',
    '{"secretKey": "ONEMIN_AI_API_KEY", "apiFormat": "onemin_features", "featuresUrl": "https://api.1min.ai/api/features", "conversationsUrl": "https://api.1min.ai/api/conversations", "streamingFeaturesUrl": "https://api.1min.ai/api/features?isStreaming=true"}'::jsonb,
    TRUE,
    3
)
ON CONFLICT (provider_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    base_url = EXCLUDED.base_url,
    auth_type = EXCLUDED.auth_type,
    auth_header = EXCLUDED.auth_header,
    settings = EXCLUDED.settings,
    is_active = EXCLUDED.is_active;

-- 3. Add secret key mappings to provider_secret_keys reference
-- (This is handled in code, but we register the key names for documentation)
COMMENT ON TABLE public.ai_provider_config IS 'AI provider registry. Required secrets:
- openrouter: OPENROUTER_API_KEY
- google_ai_studio: GOOGLE_AI_API_KEY  
- onemin: ONEMIN_AI_API_KEY
- groq: GROQ_API_KEY';