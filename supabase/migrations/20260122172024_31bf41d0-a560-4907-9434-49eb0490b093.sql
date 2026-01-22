-- =============================================
-- PROVIDER REGISTRY: Minimal Reliable Launch
-- =============================================

-- 1. Upsert OpenRouter (ACTIVE - Primary provider for launch)
INSERT INTO ai_provider_config (
  provider_name, 
  display_name,
  base_url, 
  auth_type, 
  auth_header, 
  settings, 
  is_active,
  priority
)
VALUES (
  'openrouter', 
  'OpenRouter',
  'https://openrouter.ai/api/v1', 
  'bearer', 
  'Authorization', 
  '{"secretKey": "OPENROUTER_API_KEY", "apiFormat": "openai_compatible"}'::jsonb, 
  true,
  1
)
ON CONFLICT (provider_name) DO UPDATE SET 
  base_url = EXCLUDED.base_url,
  auth_type = EXCLUDED.auth_type,
  auth_header = EXCLUDED.auth_header,
  settings = EXCLUDED.settings,
  is_active = true,
  priority = 1,
  updated_at = now();

-- 2. Upsert Qwen DashScope (DISABLED - for future direct access)
INSERT INTO ai_provider_config (
  provider_name, 
  display_name,
  base_url, 
  auth_type, 
  auth_header, 
  settings, 
  is_active,
  priority
)
VALUES (
  'qwen_dashscope', 
  'Qwen (DashScope)',
  'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', 
  'bearer', 
  'Authorization', 
  '{"secretKey": "QWEN_API_KEY", "apiFormat": "openai_compatible"}'::jsonb, 
  false,
  20
)
ON CONFLICT (provider_name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  base_url = EXCLUDED.base_url,
  settings = EXCLUDED.settings,
  is_active = false,
  updated_at = now();

-- 3. Upsert Ollama Cloud (DISABLED - experimental)
INSERT INTO ai_provider_config (
  provider_name, 
  display_name,
  base_url, 
  auth_type, 
  auth_header, 
  settings, 
  is_active,
  priority
)
VALUES (
  'ollama_cloud', 
  'Ollama Cloud',
  'https://ollama.com/api', 
  'bearer', 
  'Authorization', 
  '{"secretKey": "OLLAMA_CLOUD_API_KEY", "apiFormat": "custom"}'::jsonb, 
  false,
  30
)
ON CONFLICT (provider_name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  base_url = EXCLUDED.base_url,
  settings = EXCLUDED.settings,
  is_active = false,
  updated_at = now();

-- =============================================
-- SCOPE DEFAULTS: All scopes use OpenRouter
-- =============================================

-- Update all existing scopes to use openrouter with sensible defaults
UPDATE ai_model_config 
SET 
  provider = 'openrouter',
  model_id = CASE 
    WHEN function_type IN ('vision_documents', 'image_prompt_generation') 
      THEN 'qwen/qwen-2-vl-72b-instruct'
    WHEN function_type IN ('code_generation', 'code_fixing', 'security_audit') 
      THEN 'anthropic/claude-3.5-sonnet'
    WHEN function_type IN ('customer_chat', 'admin_ai_assistant') 
      THEN 'google/gemini-flash-1.5'
    ELSE 'google/gemini-flash-1.5'
  END,
  updated_at = now()
WHERE provider != 'openrouter' OR model_id IS NULL OR model_id = '';

-- Ensure all 13 scopes exist with openrouter defaults
INSERT INTO ai_model_config (function_type, provider, model_id, model_name, description, is_active)
VALUES 
  ('customer_chat', 'openrouter', 'google/gemini-flash-1.5', 'Gemini Flash 1.5', 'Customer-facing AI assistant widget', true),
  ('admin_ai_assistant', 'openrouter', 'google/gemini-flash-1.5', 'Gemini Flash 1.5', 'Admin panel AI chat interface', true),
  ('ai_control_panel', 'openrouter', 'google/gemini-flash-1.5', 'Gemini Flash 1.5', 'Manual AI prompt testing', true),
  ('code_generation', 'openrouter', 'anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'Generate code snippets and components', true),
  ('code_fixing', 'openrouter', 'anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'Debug and fix code issues', true),
  ('security_audit', 'openrouter', 'anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'Code security analysis', true),
  ('seo_optimization', 'openrouter', 'google/gemini-flash-1.5', 'Gemini Flash 1.5', 'Meta tags, keywords, content SEO', true),
  ('content_generation', 'openrouter', 'google/gemini-flash-1.5', 'Gemini Flash 1.5', 'Product descriptions, marketing copy', true),
  ('image_prompt_generation', 'openrouter', 'qwen/qwen-2-vl-72b-instruct', 'Qwen 2 VL 72B', 'Generate prompts for image AI', true),
  ('vision_documents', 'openrouter', 'qwen/qwen-2-vl-72b-instruct', 'Qwen 2 VL 72B', 'Analyze images and documents', true),
  ('page_builder', 'openrouter', 'google/gemini-flash-1.5', 'Gemini Flash 1.5', 'AI-assisted page creation', true),
  ('menu_builder', 'openrouter', 'google/gemini-flash-1.5', 'Gemini Flash 1.5', 'AI-assisted navigation setup', true),
  ('agentic_tasks', 'openrouter', 'anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'Multi-step autonomous actions', true)
ON CONFLICT (function_type) DO UPDATE SET
  provider = 'openrouter',
  updated_at = now();