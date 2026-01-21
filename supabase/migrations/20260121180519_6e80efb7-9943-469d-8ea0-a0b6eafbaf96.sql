-- Update the handle_new_user function to also create a customer record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Create customer record for e-commerce
  INSERT INTO public.customers (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      split_part(NEW.raw_user_meta_data ->> 'full_name', ' ', 1),
      split_part(NEW.email, '@', 1)
    ),
    NULLIF(
      regexp_replace(NEW.raw_user_meta_data ->> 'full_name', '^[^ ]+ ', ''),
      NEW.raw_user_meta_data ->> 'full_name'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Auto-assign user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Also create customer records for existing users who don't have one
INSERT INTO public.customers (id, email, first_name)
SELECT p.id, p.email, COALESCE(p.full_name, split_part(p.email, '@', 1))
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.customers c WHERE c.id = p.id
)
ON CONFLICT (id) DO NOTHING;