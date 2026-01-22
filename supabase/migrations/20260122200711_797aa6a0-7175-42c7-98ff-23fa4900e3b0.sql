
-- Fix AI models with correct, verified working OpenRouter free model IDs (January 2026)

-- Update customer_chat (homepage widget) - use reliable llama 3.3
UPDATE public.ai_model_config 
SET 
  model_id = 'meta-llama/llama-3.3-70b-instruct:free',
  model_name = 'Llama 3.3 70B Instruct',
  updated_at = now()
WHERE function_type = 'customer_chat';

-- Update chat scope
UPDATE public.ai_model_config 
SET 
  model_id = 'google/gemma-3-27b-it:free',
  model_name = 'Gemma 3 27B',
  updated_at = now()
WHERE function_type = 'chat';

-- Update all scopes still using deprecated maverick model
UPDATE public.ai_model_config 
SET 
  model_id = 'meta-llama/llama-3.3-70b-instruct:free',
  model_name = 'Llama 3.3 70B Instruct',
  updated_at = now()
WHERE model_id LIKE '%maverick%' 
   OR model_id = 'cohere/command-r:free'
   OR model_id = 'mistralai/mistral-7b-instruct:free';

-- Update coding scopes with qwen coder
UPDATE public.ai_model_config 
SET 
  model_id = 'qwen/qwen3-coder:free',
  model_name = 'Qwen3 Coder',
  updated_at = now()
WHERE function_type IN ('code_generation', 'code_fixing', 'coding');

-- Update security audit with deepseek r1 reasoning
UPDATE public.ai_model_config 
SET 
  model_id = 'deepseek/deepseek-r1-0528:free',
  model_name = 'DeepSeek R1',
  updated_at = now()
WHERE function_type IN ('security_audit', 'audit');
