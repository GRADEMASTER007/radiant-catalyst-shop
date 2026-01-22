-- Fix model IDs for OpenRouter (remove :free suffix where incorrect)
UPDATE public.ai_model_config
SET model_id = 'deepseek/deepseek-chat',
    model_name = 'DeepSeek Chat',
    updated_at = now()
WHERE provider = 'openrouter' AND model_id LIKE 'deepseek/deepseek-chat%';

UPDATE public.ai_model_config
SET model_id = 'google/gemini-flash-1.5',
    model_name = 'Gemini Flash 1.5',
    updated_at = now()
WHERE provider = 'openrouter' AND model_id LIKE 'google/gemini-flash-1.5%';

UPDATE public.ai_model_config
SET model_id = 'qwen/qwen-2.5-32b-instruct',
    model_name = 'Qwen 2.5 32B',
    updated_at = now()
WHERE provider = 'openrouter' AND model_id LIKE 'qwen/qwen-2.5%';

UPDATE public.ai_model_config
SET model_id = 'deepseek/deepseek-coder',
    model_name = 'DeepSeek Coder',
    updated_at = now()
WHERE provider = 'openrouter' AND model_id LIKE 'deepseek/deepseek-coder%';

UPDATE public.ai_model_config
SET model_id = 'deepseek/deepseek-r1',
    model_name = 'DeepSeek R1',
    updated_at = now()
WHERE provider = 'openrouter' AND model_id LIKE 'deepseek/deepseek-r1%';