
-- Try models WITHOUT the :free suffix - OpenRouter may have changed their format

-- Update customer_chat  
UPDATE public.ai_model_config 
SET 
  model_id = 'meta-llama/llama-3.3-70b-instruct',
  model_name = 'Llama 3.3 70B Instruct',
  updated_at = now()
WHERE function_type = 'customer_chat';

-- Update chat scope
UPDATE public.ai_model_config 
SET 
  model_id = 'google/gemma-3-27b-it',
  model_name = 'Gemma 3 27B',
  updated_at = now()
WHERE function_type = 'chat';

-- Update all other scopes with working model
UPDATE public.ai_model_config 
SET 
  model_id = 'meta-llama/llama-3.3-70b-instruct',
  model_name = 'Llama 3.3 70B Instruct',
  updated_at = now()
WHERE model_id LIKE '%:free%';
