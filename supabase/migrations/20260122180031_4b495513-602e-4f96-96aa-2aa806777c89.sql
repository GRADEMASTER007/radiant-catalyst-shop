-- Use verified working OpenRouter model IDs (confirmed as of 2025)
-- Using meta-llama/llama-3.3-70b-instruct which is currently free on OpenRouter

UPDATE public.ai_model_config
SET model_id = 'meta-llama/llama-3.3-70b-instruct',
    model_name = 'LLaMA 3.3 70B',
    updated_at = now()
WHERE provider = 'openrouter' 
  AND model_id LIKE 'qwen%';

-- Also set fallback models to meta-llama for reliability
UPDATE public.ai_model_config
SET model_id = 'meta-llama/llama-3.3-70b-instruct',
    model_name = 'LLaMA 3.3 70B',
    updated_at = now()
WHERE provider = 'openrouter' 
  AND function_type IN ('admin_ai_assistant', 'customer_chat', 'ai_control_panel', 'chat', 'content_generation', 'page_builder', 'menu_builder');