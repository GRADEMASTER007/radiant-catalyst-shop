-- Enforce a single primary provider (priority = 1) at the database level

-- 1) Normalize current data: make OpenRouter the only priority-1 provider
UPDATE public.ai_provider_config
SET priority = 2
WHERE priority = 1 AND provider_name <> 'openrouter';

UPDATE public.ai_provider_config
SET priority = 1
WHERE provider_name = 'openrouter';

-- 2) Create trigger function to ensure only one row can hold priority=1
CREATE OR REPLACE FUNCTION public.enforce_single_primary_provider()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.priority = 1 THEN
    -- Demote any existing primary provider
    UPDATE public.ai_provider_config
      SET priority = 2,
          updated_at = now()
    WHERE id <> NEW.id
      AND priority = 1;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Attach trigger (covers INSERT and UPDATE)
DROP TRIGGER IF EXISTS trg_enforce_single_primary_provider ON public.ai_provider_config;
CREATE TRIGGER trg_enforce_single_primary_provider
BEFORE INSERT OR UPDATE OF priority
ON public.ai_provider_config
FOR EACH ROW
EXECUTE FUNCTION public.enforce_single_primary_provider();

-- 4) Add a partial unique index as a hard guarantee
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'ai_provider_primary_unique'
  ) THEN
    CREATE UNIQUE INDEX ai_provider_primary_unique
    ON public.ai_provider_config (priority)
    WHERE priority = 1;
  END IF;
END;
$$;