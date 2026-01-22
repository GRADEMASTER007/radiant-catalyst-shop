
-- Fix AI models that are no longer available on OpenRouter
-- Update to working models: meta-llama/llama-4-maverick:free and google/gemma-3-27b-it:free

-- Update customer_chat (the homepage widget model)
UPDATE public.ai_model_config 
SET 
  model_id = 'meta-llama/llama-4-maverick:free',
  model_name = 'Llama 4 Maverick',
  updated_at = now()
WHERE function_type = 'customer_chat';

-- Update all other scopes using deprecated models
UPDATE public.ai_model_config 
SET 
  model_id = 'meta-llama/llama-4-maverick:free',
  model_name = 'Llama 4 Maverick',
  updated_at = now()
WHERE model_id IN (
  'cohere/command-r:free',
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free'
);

-- Update chat scope with a reliable model
UPDATE public.ai_model_config 
SET 
  model_id = 'google/gemma-3-27b-it:free',
  model_name = 'Gemma 3 27B',
  updated_at = now()
WHERE function_type = 'chat';
