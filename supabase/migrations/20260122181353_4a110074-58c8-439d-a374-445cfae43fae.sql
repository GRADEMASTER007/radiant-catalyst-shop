-- =============================================
-- PROVIDER REGISTRY: Add Groq (disabled for testing)
-- =============================================

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
    'groq',
    'Groq',
    'https://api.groq.com/openai/v1',
    'bearer',
    'Authorization',
    '{"secretKey": "GROQ_API_KEY", "apiFormat": "openai_compatible"}'::jsonb,
    FALSE,
    10
)
ON CONFLICT (provider_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    base_url = EXCLUDED.base_url,
    auth_type = EXCLUDED.auth_type,
    auth_header = EXCLUDED.auth_header,
    settings = EXCLUDED.settings,
    is_active = EXCLUDED.is_active;